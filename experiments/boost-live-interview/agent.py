"""Independent BOOST Jacqueline agent. Not deployed until BOOST LiveKit secrets and callbacks are configured."""
import os
import json
from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli
from livekit.plugins import openai, silero

QUESTIONS = [
    "What interests you about this position, and what experience would help you succeed?",
    "What workplace responsibilities have best prepared you to work with a team?",
    "Tell me about a time you solved a problem or adapted to an unexpected situation.",
]
SYSTEM = """You are Jacqueline, a professional mock interviewer for BOOST Ready 2 Work.
Ask the interview questions one at a time, and allow the participant time to answer.
Never invent details about their résumé, credentials, work experience, or performance.
Do not claim that finishing this conversation certifies interview completion.
Actual completion is determined by the BOOST server after reviewing interview evidence.
Offer a warm, concise transition between questions. Avoid offering coaching during the interview.
"""

class Interviewer(Agent):
    def __init__(self):
        super().__init__(instructions=SYSTEM + "\nQuestions in order:\n" + "\n".join(f"{i+1}. {q}" for i,q in enumerate(QUESTIONS)))

async def entrypoint(ctx: JobContext):
    # BOOST rooms only; fail closed if dispatched by an unrelated project.
    if not ctx.room.name.startswith("boost-interview-"):
        raise RuntimeError("Refusing non-BOOST interview room")
    await ctx.connect()
    session = AgentSession(
        stt=openai.STT(),
        llm=openai.LLM(model=os.environ.get("BOOST_INTERVIEW_MODEL", "gpt-4o-mini")),
        tts=openai.TTS(),
        vad=silero.VAD.load(),
    )
    await session.start(room=ctx.room, agent=Interviewer())
    await session.generate_reply(instructions="Greet the participant, then ask the first interview question. Keep your introduction brief.")

if __name__ == "__main__":
    if not os.environ.get("BOOST_INTERVIEW_CALLBACK_URL"):
        raise RuntimeError("BOOST_INTERVIEW_CALLBACK_URL is required before running the agent")
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, agent_name="boost-jacqueline-interview"))
