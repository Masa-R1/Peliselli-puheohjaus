"""Tools package for agent tools.

Drop new `@tool` functions into any module in this package and they will be
picked up automatically by `get_tools()`.
"""

from functools import lru_cache
from importlib import import_module
from pkgutil import iter_modules

from langchain_core.tools import BaseTool


@lru_cache(maxsize=1)
def _load_tool_modules() -> tuple[object, ...]:
    modules = []

    for module_info in sorted(iter_modules(__path__), key=lambda item: item.name):
        if module_info.name.startswith("_"):
            continue

        modules.append(import_module(f"{__name__}.{module_info.name}"))

    return tuple(modules)


@lru_cache(maxsize=1)
def get_tools() -> list[BaseTool]:
    tools: list[BaseTool] = []
    seen_names: set[str] = set()

    for module in _load_tool_modules():
        for value in vars(module).values():
            if not isinstance(value, BaseTool):
                continue

            if value.name in seen_names:
                continue

            tools.append(value)
            seen_names.add(value.name)

    return tools


__all__ = ["get_tools"]
