import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";

// // Test questions
// export async function getQuestions(file) {
//   return {
//     duration: 75,
//     questions: [
//       { id: "TASK 1", marks: 3 },
//       { id: "TASK 2", marks: 4 },
//       { id: "TASK 3", marks: 8 },
//       { id: "TASK 4", marks: 12 },
//       // { id: "2(d)", marks: 1 },
//       // { id: "2(e)", marks: 3 },
//     ],
//   };
// }

export async function getQuestions(file) {
  console.log(file);

  const ai = new GoogleGenAI({
    apiKey: "AIzaSyATU4iPtILUC8cohRUt_Ohl1R55XdF6bN8",
  });
  const d = await file.arrayBuffer();
  // Testing out using URL instead of uploading a file
  // const proxy = "https://cors-anywhere.herokuapp.com/";
  // const url =
  //   "https://discovery.ucl.ac.uk/id/eprint/10089234/1/343019_3_art_0_py4t4l_convrt.pdf";
  // const rest = await fetch(proxy + url);
  // const d = await rest.arrayBuffer();
  // console.log(rest);
  const contents = [
    {
      // text: "Summarise this document in 3"
      text: 'Extract from this paper only the exam duration in minutes (if unavailable, duration = total no. of marks), question identifiers (1(a)(i), 1(a)(ii), 2(c).. or Question 1/Q1/TASK 1/01.01, 02.03 - determine based on headings and placement, grouping subtasks into one heading when appropriate.), and their mark allocations. Output as a JSON object like:\n{"duration": 75, "questions": [{ "id": "1(a)(i)", "marks": 2 }, ...]}\nEach object must have unique ID, discard item if 0 marks.',
    },
    {
      inlineData: {
        mimeType: "application/pdf",
        data: Buffer.from(d).toString("base64"),
      },
    },
  ];
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: contents,
  });
  console.log(response.text);
  const array = response.text.slice(7, response.text.length - 3);
  const res = JSON.parse(array);
  console.log(res);
  // Sort it
  const sortedQ = res.questions.sort((a, b) => (b.id > a.id ? -1 : 1));

  return { id: res.id, questions: sortedQ };
}
