"""How-do-I answers, taken from a few short guides that ship with the app. No search index is needed for this size."""
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel, Field

from app.services.agent.tools.common import BOTH, link
from app.services.agent.types import Principal, Tool, ToolResult

KNOWLEDGE = Path(__file__).resolve().parents[1] / "knowledge"
BEST_MATCHES = 2
STOP_WORDS = frozenset("a an and are as at be by can do for from how i in is it my of on or the to what where with".split())


@dataclass(frozen=True)
class Guide:
    title: str
    role: str
    page: str
    body: str

    @property
    def words(self) -> set[str]:
        return set(_tokens(f"{self.title} {self.body}"))


def _tokens(text: str) -> list[str]:
    return [w for w in re.findall(r"[a-z]+", text.lower()) if w not in STOP_WORDS and len(w) > 2]


@lru_cache(maxsize=1)
def guides() -> tuple[Guide, ...]:
    found = []
    for path in sorted(KNOWLEDGE.glob("*.md")):
        for block in path.read_text(encoding="utf-8").split("## ")[1:]:
            lines = block.strip().splitlines()
            fields = {line.split(": ", 1)[0]: line.split(": ", 1)[1] for line in lines[1:3] if ": " in line}
            found.append(Guide(lines[0].strip(), fields.get("Role", ""), fields.get("Page", ""), " ".join(lines[3:]).strip()))
    return tuple(found)


def best_guides(question: str, role: str) -> list[Guide]:
    wanted = set(_tokens(question))
    scored = [(len(wanted & g.words), g) for g in guides() if g.role == role.lower()]
    return [g for score, g in sorted(scored, key=lambda pair: -pair[0])[:BEST_MATCHES] if score > 0]


class HowDoIArgs(BaseModel):
    question: str = Field(min_length=3, description="What the person wants to do in SAHAJ, in their words.")


async def how_do_i(principal: Principal, args: HowDoIArgs) -> ToolResult:
    matches = best_guides(args.question, principal.role)
    if not matches:
        return ToolResult({"found": False, "note": "No guide covers this. Say you do not have a guide for it."})
    steps = [{"title": g.title, "steps": g.body, "page": g.page} for g in matches]
    return ToolResult({"found": True, "guides": steps}, [link(g.title, g.page) for g in matches])


TOOLS = [
    Tool("how_do_i", "Step-by-step help for using SAHAJ (setup, classes, attendance, reviews, reports), with a link to the page.",
         HowDoIArgs, BOTH, how_do_i),
]
