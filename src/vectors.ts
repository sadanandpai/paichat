/* This file is used to upsert vectors to vectorize
  - Add your information below in the vectorsText array
  - Each vector is a string that will be embedded and upserted to vectorize
  - The size of the text in My info can be upto 400 words
  - If needed keep a overlap of 50 words between vectors
*/

import { createEmbedding } from "./helpers";

const vectorsText: string[] = [
  // `My info.....`,
  // `My info.....`,
  // ....
];

export async function upsertVectors(env: CloudflareBindings) {
  for (let i = 0; i < vectorsText.length; i++) {
    const embedding = await createEmbedding(env, vectorsText[i]);
    await env.VECTORIZE.upsert([
      {
        id: (i + 1).toString(),
        values: embedding,
        metadata: {
          prompt: vectorsText[i],
        },
      },
    ]);
  }
}
