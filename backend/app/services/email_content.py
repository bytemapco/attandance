import os
from email.utils import parseaddr
from html.parser import HTMLParser

from jinja2 import Environment, FileSystemLoader, select_autoescape

_TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "email")
_jinja_env = Environment(
    loader=FileSystemLoader(_TEMPLATES_DIR),
    autoescape=select_autoescape(["html", "xml"]),
)


class _PlainTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.ignored_element: str | None = None

    def handle_data(self, data: str) -> None:
        content = data.strip()
        if content and not self.ignored_element:
            self.parts.append(content)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        classes = dict(attrs).get("class", "") or ""
        if tag in {"head", "style", "script", "title"} or (tag == "div" and "preheader" in classes.split()):
            self.ignored_element = tag
            return
        if self.ignored_element:
            return
        if tag == "a":
            href = dict(attrs).get("href")
            if href:
                self.parts.append(href)

    def handle_endtag(self, tag: str) -> None:
        if self.ignored_element == tag:
            self.ignored_element = None


def render_email_template(template_name: str, context: dict[str, object]) -> str:
    return _jinja_env.get_template(template_name).render(**context)


def plain_text_from_html(html_content: str) -> str:
    parser = _PlainTextExtractor()
    parser.feed(html_content)
    return "\n".join(parser.parts)


def is_valid_email_address(address: str) -> bool:
    _, parsed = parseaddr(address)
    return bool(parsed and parsed == address and "@" in parsed)
