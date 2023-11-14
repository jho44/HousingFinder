import OpenAI from "openai";
import { ChatCompletionUserMessageParam } from "openai/resources/chat/completions.mjs";
import { trimWhitespaceOnAllLines } from "../utils.ts";

const { OPENAI_API_KEY } = process.env;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function extractEntitiesFromPost({
  postID: id,
  post: message,
  created: created_time,
}: {
  postID: string;
  post: string;
  created: string;
}) {
  const t0 = performance.now();
  // price, duration, amenities, commute_distance to UCLA, pets_policy, desired_gender, type of post, and location of the lease?
  const task =
    trimWhitespaceOnAllLines(`This was posted in the San Francisco Housing Group on ${created_time}. What entities can you extract from it?
  Note: if the post mentions "asap" then utilitize the datetime it was posted.
  
  ${message}`);

  const logMetadata = { id };
  console.log(logMetadata, "#### STARTING TASK ####");
  console.log(logMetadata, task);
  const messages: ChatCompletionUserMessageParam[] = [
    { role: "user", content: task },
  ];
  const functions = [
    {
      name: "extract_entities",
      description: "Extract entities from some post",
      parameters: {
        type: "object",
        properties: {
          price_range: {
            type: "object",
            properties: {
              low: { type: "number" },
              high: { type: "number" },
            },
          },
          duration: {
            type: "object",
            description: "How long would the lease last?",
            properties: {
              start: {
                type: "string",
                description:
                  "when the lease starts, in the form of M/D/YYYY or M/YYYY",
              },
              end: {
                type: "string",
                description:
                  "when the lease ends, in the form of M/D/YYYY or M/YYYY",
              },
            },
          },
          amenities: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "parking",
                "furnished",
                "laundry",
                "AC",
                "internet",
                "common areas",
                "balcony",
                "patio",
                "yard",
                "heating",
                "smoke free",
                "cable",
                "security",
                "kitchen",
                "gym",
                "pool",
                "pets",
              ],
            },
          },
          // commute_walkable: {
          //   type: "string",
          //   description: "whether the lease is within walking distance of UCLA",
          //   enum: ["walking", "beyond_walking"],
          // },
          desired_gender: { type: "string", enum: ["male", "female"] },
          post_type: {
            type: "string",
            enum: ["offering_lease", "searching_for_lease"],
            description:
              "whether the post's author is offering a lease or searching for a lease",
          },
        },
        required: ["post_type"],
      },
    },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4-1106-preview",
    messages: messages,
    functions: functions,
    function_call: { name: "extract_entities" },
  });
  const responseMessage = response.choices[0].message;

  console.log(
    logMetadata,
    `extract finished in: ${performance.now() - t0}`,
    responseMessage.function_call?.arguments,
  );
  if (!responseMessage.function_call) {
    throw new Error(JSON.stringify(responseMessage));
  }
  const res = JSON.parse(responseMessage.function_call?.arguments);
  if (res.commute_walkable === "walking") {
    if (res.amenities) res.amenities.push("walkable");
    else res.amenities = ["walkable"];
  }
  delete res.commute_walkable;
  return res;
}
