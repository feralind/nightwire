import { describe, expect, it } from "vitest";
import {
  AAA_TARGETS,
  generatedCourseDrafts,
  generatedCrimeDrafts,
  generatedJobDrafts,
} from "@/content/aaaExpand";
import { DISTRICTS } from "@/content/districts";

describe("AAA expansion drafts", () => {
  it("hits crime/job/course draft targets", () => {
    expect(generatedCrimeDrafts).toHaveLength(AAA_TARGETS.crimes);
    expect(generatedJobDrafts).toHaveLength(AAA_TARGETS.jobs);
    expect(generatedCourseDrafts).toHaveLength(AAA_TARGETS.courses);
  });

  it("ships 8 districts live", () => {
    expect(DISTRICTS).toHaveLength(AAA_TARGETS.districts);
  });
});
