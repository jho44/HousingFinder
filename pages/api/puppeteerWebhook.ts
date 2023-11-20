/*
TODO: to be turned into cron job rather than webhook handler
*/
import type { NextApiRequest, NextApiResponse } from "next";
import { sfCollection2 } from "@/lib/api/mongo.ts";
import { extractEntitiesFromPost } from "@/lib/api/llm";
import fs from "fs";

type ReceivedPost = {
  postID: string;
  post: string;
  author: string;
  authorFacebookID: string | null;
  created: string;
  profileImgUrl: string;
};

type DBPost = {
  id: string;
  msg: string;
  created_at: Date;
  author: {
    name: string;
    id: string | undefined;
    profileImgUrl: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  // const posts: ReceivedPost[] = JSON.parse(
  //   fs.readFileSync(`${process.cwd()}/lib/api/posts/sfPosts.json`, {
  //     encoding: "utf8",
  //   }),
  // );
  const posts: ReceivedPost[] = [
    {
      postID: "6867427846674478",
      post: "Hi everyone! I'm looking to move to SF/Oakland area and would like to lease a place with 2-3 other roommates. I work remotely for a tech company in Boston and am a responsible/clean roommate.\n- Budget $1000/mo\n- I do have a small cat & car so would need car/pet flexibility/options. In-unit washer/laundry would be great but other than pretty flexible to other amenities.",
      author: "Lansing Cai",
      authorFacebookID: "1121400393",
      created: "2023-11-17T23:41:00.945Z",
      profileImgUrl:
        "https://scontent-lax3-1.xx.fbcdn.net/v/t1.6435-1/66436682_10213547914028490_7052059102842716160_n.jpg?stp=cp0_dst-jpg_p80x80&_nc_cat=108&ccb=1-7&_nc_sid=2b6aad&_nc_ohc=yXIvC1pqle4AX-Mum_F&_nc_ht=scontent-lax3-1.xx&oh=00_AfCVNKCrpX8wXOMRsxjY2tj6zjHLpd-BQ9jfLnqc_aR9iQ&oe=6580AE7A",
    },
    {
      postID: "6867479030002693",
      post: "Looking for two roommates to take large rooms in 3 bed, 2 bath NoPa apartment with great amenities and awesome location starting as early as December 1st.\n· Room 1: $1600 / month, available December 1st (could move in as early as November 20th)\n· Room 2: $1600 / month, available January 1st\n· Utilities: ~$60 / person / month\nAbout the apartment\n· Located in central NoPa, awesome location in the center of the city where it’s easy to get to any neighborhood\n· 1 block from the panhandle, easy walk to golden gate park and all the bars on Divisadero and Trader Joe’s\n· Across the street from a chill, newly opened wine bar\n· Easy commute to downtown with 5 bus only two blocks away\n· Laundry and dishwasher in unit\n· Huge shared kitchen (fully stocked with appliances) and living / dining area\n· Tons of closet space including hall closet for bikes & skis\n· Backyard with outdoor dining table\n· Hardwood floors, high (12-ft) ceilings, great light\n· Full house has 3 bedrooms, 2 bathrooms and one office attached to a bedroom\n· 6-month lease with month-to-month thereafter\n· Rooms come unfurnished\n· Biggest limitations: apartment does not come with a garage so it’s street parking only which is hit or miss. Also unfortunately no pets.\nAbout me\nI’m 28 and originally from Connecticut. I work in VC and go to the office 3 days / week. In my free time I like to play tennis, go to concerts, try new restaurants / bars, read and ski in the winter.\nLooking for roommates who are down to hang and be social in common spaces, go out or throw events together occasionally, while also being respectful and clean, etc.\nDM me for more information!",
      author: "David Maloof",
      authorFacebookID: "100000201070268",
      created: "2023-11-17T23:41:02.038Z",
      profileImgUrl:
        "https://scontent-lax3-2.xx.fbcdn.net/v/t1.6435-1/67058750_2799867436696598_3317663366289293312_n.jpg?stp=cp0_dst-jpg_p80x80&_nc_cat=101&ccb=1-7&_nc_sid=2b6aad&_nc_ohc=nepiBwVJ3McAX9GoYpB&_nc_ht=scontent-lax3-2.xx&oh=00_AfDgnefD_gVSKnGBZ5hfDL946_Lvo3mOZ0UJqm_xLJc5rA&oe=6580D318",
    },
    {
      postID: "6867188973365032",
      post: "Hi everyone! My name’s Jackie and I’m looking for a room to rent for a late-December, latest December 31st move-in. I’m 25 and love to try out new hobbies (right now I’m trying to learn to sew). Also have been trying more active hobbies so always down for a hike or taking a class. I work in person mainly everyday and take a shuttle down to Menlo Park for work so ideally would like to stay in lower haight or upper mission. Anywhere close like haight-ashbury or NOPA could also works! Love to keep common areas clean and very communicative!\nMy budget is no more than $1600. Also I need an in-unit washer/dryer \n If you know anyone who’s looking for a roomie pls lmk!",
      author: "Jacqueline Anaeto",
      authorFacebookID: "100025564636458",
      created: "2023-11-17T23:41:03.103Z",
      profileImgUrl:
        "https://scontent-lax3-1.xx.fbcdn.net/v/t1.6435-1/198295210_871088600419953_8711642928858211155_n.jpg?stp=cp0_dst-jpg_p80x80&_nc_cat=102&ccb=1-7&_nc_sid=2b6aad&_nc_ohc=NN5qsUD3hbkAX8v_6DB&_nc_ht=scontent-lax3-1.xx&oh=00_AfDen81ULGz_K8nVfYj5z6Lg6Qtl3hP9WbZnWKRmx9Fmkw&oe=6580D508",
    },
    {
      postID: "6866036396813623",
      post: "$2,600 Furnished one-bedroom sublet available in the Mission\nHi there!\nI’m looking for someone to sublet my lovely apartment in the Mission for anywhere from 2 weeks to 1-2 months starting 12/1/23 (dates and time frame flexible).\nAbout you:\nSomeone who has a full-time job\nTidy, respectful, quiet\nOpen to taking care of (aka watering every week) plants while subletting\nPerks of the place:\nWasher/dryer in-unit\nCompletely furnished apartment other than the bed, which will be a queen-size air mattress; WFH standing desk setup and monitor\n2 blocks from 24th street (close to some of the best food and bodegas in SF); <10 min walk to the 24th street Bart stop\nRight next to the highway 280 AND 101 exits - ample street parking nearby\nMoney:\n- Rent: $2600\n- Utilities: $150 (this is in addition to rent)\n- $250 refundable deposit",
      author: "Jessica Choi",
      authorFacebookID: "1268970046",
      created: "2023-11-17T23:41:03.146Z",
      profileImgUrl:
        "https://scontent-lax3-1.xx.fbcdn.net/v/t31.18172-1/17098076_10211617402731833_8351410132242283974_o.jpg?stp=c16.0.80.80a_cp0_dst-jpg_p80x80&_nc_cat=110&ccb=1-7&_nc_sid=2b6aad&_nc_ohc=-J8NQQlznwYAX-wqAkE&_nc_ht=scontent-lax3-1.xx&oh=00_AfAcmribpkzzelH9tuIIN-F1yhCUjxpBztuCb0niJC4XCQ&oe=6580A1FB",
    },
  ];
  const formattedPosts = await Promise.all(
    posts
      .filter((post) => post.postID !== "https:")
      .map(async (post) => {
        if (await sfCollection2.findOne({ id: post.postID })) {
          console.log(`SKIPPED ${post.postID}`);
          return null;
        }
        const doc = {
          id: post.postID,
          msg: post.post,
          created_at: new Date(post.created),
          author: {
            name: post.author,
            id: post.authorFacebookID,
            profileImgUrl: post.profileImgUrl,
          },
        };

        try {
          Object.assign(doc, await extractEntitiesFromPost(post));
        } catch (err) {
          // TODO: retries?
          console.error("Failed to extract entities from post", post, err);
          return null;
        }
        console.log(`ADDED ${post.postID}`);
        return doc;
      }),
  );

  await sfCollection2.insertMany(formattedPosts.filter(Boolean) as DBPost[]);
  console.log("DONE!");
  res.send("ok");
}
