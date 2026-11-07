"""Every tool the assistant has. A role is only ever shown the tools it may use."""
from typing import Optional

from app.services.agent.tools import (
    admin_insights,
    admin_oversight,
    approval_actions,
    approvals,
    attendance_actions,
    attendance_reads,
    class_actions,
    class_edits,
    class_setup_actions,
    help_tool,
    import_actions,
    lookups,
    master_data_actions,
    master_data_edits,
    messaging,
    people_edits,
    report_tools,
    settings_actions,
    setup_lookups,
    staff_reads,
    substitute_tools,
    teacher_reads,
    watch_tools,
)
from app.services.agent.types import Tool

_MODULES = (
    teacher_reads, report_tools, attendance_reads, admin_insights, admin_oversight, staff_reads, approvals, lookups, messaging, help_tool,
    class_actions, attendance_actions, approval_actions,
    setup_lookups, master_data_actions, master_data_edits, people_edits, class_setup_actions, class_edits,
    import_actions, settings_actions, substitute_tools, watch_tools,
)
TOOLS: dict[str, Tool] = {tool.name: tool for module in _MODULES for tool in module.TOOLS}


def get(name: str) -> Optional[Tool]:
    return TOOLS.get(name)


def tools_for(role: str) -> list[Tool]:
    return [tool for tool in TOOLS.values() if role in tool.roles]
