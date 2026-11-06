"""Every tool the assistant has. A role is only ever shown the tools it may use."""
from typing import Optional

from app.services.agent.tools import (
    admin_insights,
    approval_actions,
    approvals,
    attendance_actions,
    class_actions,
    help_tool,
    lookups,
    messaging,
    report_tools,
    teacher_reads,
)
from app.services.agent.types import Tool

_MODULES = (
    teacher_reads, report_tools, admin_insights, approvals, lookups, messaging, help_tool,
    class_actions, attendance_actions, approval_actions,
)
TOOLS: dict[str, Tool] = {tool.name: tool for module in _MODULES for tool in module.TOOLS}


def get(name: str) -> Optional[Tool]:
    return TOOLS.get(name)


def tools_for(role: str) -> list[Tool]:
    return [tool for tool in TOOLS.values() if role in tool.roles]
