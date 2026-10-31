import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/live-api", () => ({ liveCall: vi.fn() }));

import { liveCall } from "@/lib/live-api";
import { fetchCbtSummary, pickQuizOption, startOrResumeCbt } from "./cbt";

describe("live CBT", () => {
  beforeEach(() => vi.mocked(liveCall).mockReset());

  it("fetches and normalizes a tutorial's CBT summary", async () => {
    vi.mocked(liveCall).mockResolvedValue({
      response: 200,
      success: true,
      message: "",
      data: [{ cbt_title: "Whole numbers practice", quiz_question_counts: "2" }],
    });

    expect(await fetchCbtSummary("TUT001")).toEqual({
      assessment: { label: "Whole numbers practice", url: "/tutorials/TUT001/practice", questionCount: 2 },
      questions: [],
    });
    expect(liveCall).toHaveBeenCalledWith("/user/cbt/fetch-cbt-summary", { tutorial_id: "TUT001" });
  });

  it("uses a launch URL when the CBT is hosted externally", async () => {
    vi.mocked(liveCall).mockResolvedValue({
      response: 200,
      success: true,
      message: "",
      summary: { total_questions: 10, launch_url: "https://cbt.example/test/1" },
    });

    expect((await fetchCbtSummary("TUT001"))?.assessment).toEqual({
      label: "Take CBT practice",
      url: "https://cbt.example/test/1",
      questionCount: 10,
    });
  });

  it("returns no assessment when the summary has no questions or launch URL", async () => {
    vi.mocked(liveCall).mockResolvedValue({
      response: 200,
      success: true,
      message: "",
      data: [{ quiz_question_counts: "0" }],
    });
    await expect(fetchCbtSummary("TUT842")).resolves.toBeNull();
  });

  it("starts or resumes a quiz and fetches the displayed question", async () => {
    vi.mocked(liveCall)
      .mockResolvedValueOnce({
        response: 200,
        success: true,
        message: "",
        tutorial_id: "TUT1528",
        display_question_no: 1,
        display_question_id: "QUES1",
        buttons: [
          { display_question_no: "1", question_id: "QUES1", attempted: "no" },
          { display_question_no: "2", question_id: "QUES2", attempted: "yes" },
        ],
      })
      .mockResolvedValueOnce({
        response: 200,
        success: true,
        message: "",
        tutorial_id: "TUT1528",
        question_id: "QUES1",
        questions: [{
          question_text: "Living and non-living things can be matter",
          question_pix: "matter.png",
          questionsStoragePath: "https://leaderstutors.com/questions",
          selected_option: null,
          options: [
            { option_id: "A", option_text: "man", option_pix: "man.png", optionsStoragePath: "https://leaderstutors.com/options" },
            { option_id: "B", option_text: "non-living thing", option_pix: "", optionsStoragePath: "https://leaderstutors.com/options" },
          ],
        }],
      });

    const result = await startOrResumeCbt("TUT1528");

    expect(result.session).toEqual({
      tutorialId: "TUT1528",
      displayQuestionNo: 1,
      displayQuestionId: "QUES1",
      buttons: [
        { number: 1, questionId: "QUES1", attempted: false },
        { number: 2, questionId: "QUES2", attempted: true },
      ],
    });
    expect(result.question).toEqual({
      id: "QUES1",
      prompt: "Living and non-living things can be matter",
      imageUrl: "https://leaderstutors.com/questions/matter.png",
      selectedOptionId: undefined,
      options: [
        { id: "A", text: "man", imageUrl: "https://leaderstutors.com/options/man.png" },
        { id: "B", text: "non-living thing", imageUrl: undefined },
      ],
    });
    expect(vi.mocked(liveCall).mock.calls).toEqual([
      ["/user/cbt/start-resume-quiz", { tutorial_id: "TUT1528" }],
      ["/user/cbt/fetch-quiz-question", { tutorial_id: "TUT1528", question_id: "QUES1" }],
    ]);
  });

  it("submits the selected option to the live attempt", async () => {
    vi.mocked(liveCall).mockResolvedValue({ response: 200, success: true, message: "QUESTION ATTEMPTED! Well done." });
    await pickQuizOption({ tutorialId: "TUT1528", questionId: "QUES1", optionId: "D" });
    expect(liveCall).toHaveBeenCalledWith("/user/cbt/pick-quiz-option", {
      tutorial_id: "TUT1528",
      question_id: "QUES1",
      option_id: "D",
    });
  });
});
