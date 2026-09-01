import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let skills = db.getSkills();

    if (category && category !== "All") {
      skills = skills.filter((s) => s.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      skills = skills.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          (s.tags && s.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return NextResponse.json({ skills });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.title || !body.category) {
      return NextResponse.json({ error: "Title and Category are required" }, { status: 400 });
    }

    const newSkill = db.createSkill(body);
    return NextResponse.json({ success: true, skill: newSkill });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
