from pathlib import Path
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "SurgiFind-Pitch-Deck.pptx"
SLATE = RGBColor(15, 23, 42)
MUTED = RGBColor(71, 85, 105)
TEAL = RGBColor(13, 148, 136)
TEAL_LIGHT = RGBColor(240, 253, 250)
WHITE = RGBColor(255, 255, 255)
BORDER = RGBColor(204, 251, 241)

slides = [
    {
        "title": "SurgiFind",
        "subtitle": "Find the right hospital for surgery with clarity on price, insurance, and booking.",
        "body": [
            "SurgiFind helps patients discover surgical care faster by combining hospital search, price comparison, insurance matching, and guided booking in one platform.",
        ],
    },
    {
        "title": "Problem",
        "bullets": [
            "Hospital discovery is fragmented across search engines, aggregators, and hospital websites.",
            "Price transparency is poor, so families cannot compare likely costs with confidence.",
            "Insurance network and coverage checks are confusing and time-consuming.",
            "Booking a consultation or surgery often requires manual calls and follow-ups.",
        ],
    },
    {
        "title": "Solution",
        "bullets": [
            "Hospital and surgery search",
            "Cost range comparison",
            "Insurance plan matching",
            "Conversational guidance",
            "Authenticated booking and booking history",
        ],
    },
    {
        "title": "Product Flow",
        "bullets": [
            "Search by surgery, city, budget, rating, or hospital type.",
            "Compare hospitals with price ranges and availability.",
            "Use the chat assistant in natural language.",
            "Review matching insurance plans.",
            "Book a consultation or surgery slot securely.",
            "Track or cancel the booking from booking history.",
        ],
    },
    {
        "title": "Key Features",
        "bullets": [
            "Smart surgery search with filters",
            "Conversational assistant with direct search and symptom-assisted guidance",
            "Insurance matching against covered surgeries and network hospitals",
            "Secure authentication with booking history",
            "Slot reservation flow with cancellation support",
        ],
    },
    {
        "title": "Business Potential",
        "bullets": [
            "Lead generation fees from hospitals",
            "Premium listings or sponsored discovery placement",
            "Booking conversion commissions",
            "Insurance partnership and referral workflows",
            "Care navigation subscriptions for high-intent users",
        ],
    },
    {
        "title": "Next Steps",
        "bullets": [
            "Add a payment system for deposits, booking confirmation, refunds, and receipts",
            "Complete production cloud deployment with CI/CD, secrets handling, and monitoring",
            "Move booking reservation and insert into stronger transactional workflows",
            "Add doctor-level scheduling and richer hospital-side operations",
            "Introduce rate limiting, WAF, audit trails, and production security hardening",
        ],
    },
    {
        "title": "Long-Run Architecture",
        "bullets": [
            "Global edge delivery and CDN",
            "Load balancer and autoscaled app runtime",
            "API management for policies, versioning, and rate limiting",
            "Redis cache for frequent reads and counters",
            "Queue and workers for notifications and reconciliation",
            "Observability, secrets management, and audit logging",
        ],
    },
    {
        "title": "Team",
        "bullets": [
            "Aditi Prasad",
            "Mayank Prasad",
            "Deepnarayan Lohra",
        ],
    },
    {
        "title": "Closing",
        "body": [
            "When patients need surgery, they should not have to navigate cost, trust, insurance, and booking alone.",
            "SurgiFind gives them one place to decide and act.",
        ],
    },
]


def set_background(slide):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = WHITE


def add_header_band(slide, title: str, index: int):
    band = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.45), Inches(0.35), Inches(12.4), Inches(0.9))
    band.fill.solid()
    band.fill.fore_color.rgb = TEAL_LIGHT
    band.line.color.rgb = BORDER
    title_box = slide.shapes.add_textbox(Inches(0.75), Inches(0.52), Inches(8.5), Inches(0.45))
    tf = title_box.text_frame
    p = tf.paragraphs[0]
    r = p.add_run()
    r.text = title
    r.font.size = Pt(28)
    r.font.bold = True
    r.font.color.rgb = SLATE
    chip = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(11.0), Inches(0.52), Inches(1.2), Inches(0.34))
    chip.fill.solid()
    chip.fill.fore_color.rgb = TEAL
    chip.line.color.rgb = TEAL
    chip_box = slide.shapes.add_textbox(Inches(11.0), Inches(0.56), Inches(1.2), Inches(0.25))
    chip_tf = chip_box.text_frame
    chip_p = chip_tf.paragraphs[0]
    chip_p.alignment = PP_ALIGN.CENTER
    chip_r = chip_p.add_run()
    chip_r.text = f"{index:02d}"
    chip_r.font.size = Pt(12)
    chip_r.font.bold = True
    chip_r.font.color.rgb = WHITE


def add_body(slide, subtitle=None, bullets=None, body=None):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.7), Inches(1.55), Inches(12.0), Inches(5.3))
    card.fill.solid()
    card.fill.fore_color.rgb = WHITE
    card.line.color.rgb = RGBColor(226, 232, 240)

    top = 1.95
    if subtitle:
        box = slide.shapes.add_textbox(Inches(1.0), Inches(top), Inches(10.8), Inches(0.8))
        tf = box.text_frame
        p = tf.paragraphs[0]
        r = p.add_run()
        r.text = subtitle
        r.font.size = Pt(20)
        r.font.bold = True
        r.font.color.rgb = SLATE
        top += 0.8

    if body:
        for paragraph in body:
            box = slide.shapes.add_textbox(Inches(1.0), Inches(top), Inches(10.8), Inches(0.7))
            tf = box.text_frame
            p = tf.paragraphs[0]
            r = p.add_run()
            r.text = paragraph
            r.font.size = Pt(18)
            r.font.color.rgb = MUTED
            top += 0.65

    if bullets:
        box = slide.shapes.add_textbox(Inches(1.0), Inches(top), Inches(10.8), Inches(3.9))
        tf = box.text_frame
        tf.word_wrap = True
        first = True
        for item in bullets:
            p = tf.paragraphs[0] if first else tf.add_paragraph()
            first = False
            p.text = item
            p.level = 0
            p.font.size = Pt(20)
            p.font.color.rgb = SLATE
            p.bullet = True
            p.space_after = Pt(10)


def add_architecture_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_background(slide)
    add_header_band(slide, "Long-Run Architecture Diagram", len(prs.slides))
    x_positions = [0.9, 3.45, 6.0, 8.55, 11.1]
    top = 2.0
    labels = [
        ("Users", "Patients\nAdmins"),
        ("Edge", "CDN\nWAF\nLoad Balancer"),
        ("App", "Next.js UI\nBFF APIs\nAutoscale Runtime"),
        ("Platform", "Redis Cache\nQueue + Workers\nObservability"),
        ("Data + External", "Supabase\nOpenAI\nPayments\nNotifications"),
    ]

    for index, (title, body) in enumerate(labels):
        shape = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(x_positions[index]),
            Inches(top),
            Inches(1.95),
            Inches(2.35),
        )
        shape.fill.solid()
        shape.fill.fore_color.rgb = TEAL_LIGHT if index % 2 else WHITE
        shape.line.color.rgb = BORDER
        box = slide.shapes.add_textbox(
            Inches(x_positions[index] + 0.12),
            Inches(top + 0.15),
            Inches(1.7),
            Inches(1.95),
        )
        tf = box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = title
        r.font.size = Pt(18)
        r.font.bold = True
        r.font.color.rgb = SLATE
        for line in body.split("\n"):
            para = tf.add_paragraph()
            para.alignment = PP_ALIGN.CENTER
            para.text = line
            para.font.size = Pt(14)
            para.font.color.rgb = MUTED

    for start_x in [2.85, 5.4, 7.95, 10.5]:
        connector = slide.shapes.add_shape(
            MSO_SHAPE.CHEVRON,
            Inches(start_x),
            Inches(2.82),
            Inches(0.32),
            Inches(0.34),
        )
        connector.fill.solid()
        connector.fill.fore_color.rgb = TEAL
        connector.line.color.rgb = TEAL

    bottom = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.9), Inches(5.0), Inches(11.9), Inches(1.15))
    bottom.fill.solid()
    bottom.fill.fore_color.rgb = RGBColor(248, 250, 252)
    bottom.line.color.rgb = RGBColor(226, 232, 240)
    bottom_box = slide.shapes.add_textbox(Inches(1.15), Inches(5.22), Inches(11.4), Inches(0.65))
    bottom_tf = bottom_box.text_frame
    bottom_tf.word_wrap = True
    bottom_p = bottom_tf.paragraphs[0]
    bottom_p.alignment = PP_ALIGN.CENTER
    bottom_r = bottom_p.add_run()
    bottom_r.text = "Current app remains the core product. Long-term scale comes from edge controls, autoscaling, API governance, caching, security, observability, and payment integration."
    bottom_r.font.size = Pt(16)
    bottom_r.font.color.rgb = SLATE
    return slide


def main():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    for index, spec in enumerate(slides, start=1):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        set_background(slide)
        add_header_band(slide, spec["title"], index)
        add_body(slide, spec.get("subtitle"), spec.get("bullets"), spec.get("body"))

    add_architecture_slide(prs)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(OUTPUT))
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
