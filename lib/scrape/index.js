const puppeteer = require("puppeteer");
const dayjs = require("dayjs");
const fs = require("fs");
const isBetween = require("dayjs/plugin/isBetween");
dayjs.extend(isBetween);
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const VERBOSE = true;
const log = (...stuff) => {
  if (VERBOSE) console.log(stuff);
};

const parseDateStr = (rawDateStr) => {
  const dateStr = rawDateStr.trim();
  let parsed;
  const now = dayjs();
  if (
    (parsed = dayjs(dateStr, "MMMM D [at] h:mm A", true)) &&
    parsed.isValid()
  ) {
    parsed.set("year", now.get("year"));
    return parsed.toDate();
  }

  if ((parsed = dayjs(dateStr, "MMMM D", true)) && parsed.isValid()) {
    parsed.set("year", now.get("year"));
    return parsed.toDate();
  }

  if (dateStr.startsWith("Yesterday") || dateStr === "a day ago") {
    return now.subtract(1, "day").toDate();
  }

  if ((parsed = dayjs(dateStr, "H [hours ago]", true)) && parsed.isValid()) {
    return now.subtract(parsed.get("hour"), "hour").toDate();
  }

  if ((parsed = dayjs(dateStr, "H[h]", true)) && parsed.isValid()) {
    return now.subtract(parsed.get("hour"), "hour").toDate();
  }

  return new Date(dateStr);
};

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disable-notifications"],
  });
  await browser
    .defaultBrowserContext()
    .overridePermissions("https://facebook.com/", [
      "clipboard-read",
      "clipboard-write",
    ]);
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(
    "https://www.facebook.com/",
    // 'https://www.facebook.com/groups/bayarearentals?sorting_setting=CHRONOLOGICAL_LISTINGS',
  );

  await page.waitForSelector("input[name=email]", {
    visible: true,
    timeout: 3000,
  });

  await page.type("input[name=email]", process.env.FB_EMAIL);
  await page.type("input[name=pass]", process.env.FB_PWD);

  await page.click("button[name=login]");

  await page.waitForNavigation({ waitUntil: "networkidle0" });

  await page.goto(
    "https://www.facebook.com/groups/843764532374203?sorting_setting=CHRONOLOGICAL",
  );

  await page.waitForSelector("div[role=feed]");

  const targetClass = "div[role=feed] .x1yztbdb.x1n2onr6.xh8yej3.x1ja2u2z";
  let numPosts = await page.$$eval(targetClass, (posts) => posts.length);
  while (numPosts < 2) {
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
    // Wait for new elements to appear
    await page.waitForFunction(
      (targetClass, currentCount) => {
        const elements = document.querySelectorAll(targetClass);
        return elements.length > currentCount;
      },
      { polling: "mutation", timeout: 10000 },
      targetClass,
      numPosts,
    );
    numPosts = await page.$$eval(targetClass, (posts) => posts.length);
    log({ numPosts });
  }

  const hoverOverUrl = async (linkElHandle) => {
    // hover over postUrlEls to ensure its href shifts from #
    await linkElHandle.scrollIntoView(); // Scroll into view if necessary
    log("scrolled into view");
    const boundingBox = await linkElHandle.boundingBox();
    await page.mouse.move(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2,
    );
    log("moved mouse");
  };

  const getDateStrViaHtml = async (post) =>
    await page.evaluate((p) => {
      const spanOrderMap = {};
      p.querySelectorAll("span[aria-labelledby^=':'] > span span").forEach(
        (span) => {
          const computedStyle = getComputedStyle(span);
          if (computedStyle.top.startsWith("0") && computedStyle.order) {
            spanOrderMap[computedStyle.order] = span.innerText;
          }
        },
      );
      const orderedSpanOrders = Object.entries(spanOrderMap);
      orderedSpanOrders.sort((a, b) => a[0] - b[1]);
      return orderedSpanOrders.map(([a, b]) => b).join("");
    }, post);

  const getDateStrViaClipboard = async (linkElHandle) => {
    // select postUrlEl and copy to clipboard
    await linkElHandle.scrollIntoView(); // Scroll into view if necessary
    await new Promise((r) => setTimeout(r, 1000));
    await page.evaluate(
      (from, to) => {
        const selection = from.getRootNode().getSelection();
        const range = document.createRange();
        range.setStartBefore(from);
        range.setEndAfter(to);
        selection.removeAllRanges();
        selection.addRange(range);
      },
      linkElHandle,
      linkElHandle,
    );

    // The clipboard api does not allow you to copy, unless the tab is focused.
    await page.bringToFront();

    return await page.evaluate(async () => {
      // Copy the selected content to the clipboard
      document.execCommand("copy");
      // Obtain the content of the clipboard as a string
      const clipboardContent = await navigator.clipboard.readText();
      return clipboardContent.split("\n")[0];
    });
  };

  const postElHandles = await page.$$(targetClass);
  const res = [];
  for (let i = postElHandles.length - 1; i >= 0; i--) {
    const post = postElHandles[i];

    await page.evaluate((p) => {
      // const seeMoreBtn = p.querySelector('div[data-ad-preview=message] span div[role=button]')
      const seeMoreBtn = p.querySelector("div[dir=auto] span div[role=button]");
      if (seeMoreBtn) seeMoreBtn.click();
    }, post);

    // const msg = await page.evaluate((p) => p.querySelector('div[data-ad-preview=message]')?.innerText, post)
    const msg = await page.evaluate(
      (p) => p.querySelector("div[dir=auto]")?.innerText,
      post,
    );
    log({ msg });
    if (!msg) continue;

    const dateElHandle = await post.$(
      ".x1i10hfl.xjbqb8w.x6umtig.x1b1mbwd.xaqea5y.xav7gou.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.x1heor9g.xt0b8zv.xo1l8bm",
    );

    await hoverOverUrl(dateElHandle);

    let dateStr = await getDateStrViaHtml(post);
    log({ dateStrViaHtml: dateStr });
    if (!dateStr) {
      dateStr = await getDateStrViaClipboard(dateElHandle);
      log({ dateStrViaCopy: dateStr });
    }
    const postDate = parseDateStr(dateStr);
    log({ postDate });
    // ignore posts older than 3 months old
    if (
      !dayjs(postDate).isBetween(
        dayjs().subtract(3, "month"),
        dayjs(),
        "day",
        "[]",
      )
    ) {
      log("older than 3 months old", {
        threeMonthsAgo: dayjs().subtract(3, "month").toDate(),
        postDate: dayjs(postDate).toDate(),
        today: dayjs().toDate(),
      });
      continue;
    }

    const postUrl = await page.evaluate((linkEl) => linkEl.href, dateElHandle);
    const postUrlSplit = postUrl.split("/");
    const postsInd = postUrlSplit.indexOf("posts");
    log({ postsInd });
    if (postsInd === -1) continue;

    const authorElHandle = await post.$(
      ".x1i10hfl.xjbqb8w.x6umtig.x1b1mbwd.xaqea5y.xav7gou.x9f619.x1ypdohk.xt0psk2.xe8uvvx.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x16tdsg8.x1hl2dhg.xggy1nq.x1a2a7pz.xt0b8zv.xzsf02u.x1s688f",
    );
    const authorUrl = await page.evaluate(
      (authorEl) => ({ href: authorEl.href, innerText: authorEl.innerText }),
      authorElHandle,
    );
    let authorFacebookID;
    if (authorUrl.href) {
      const authorUrlSplit = authorUrl.href.split("/");
      authorFacebookID = authorUrlSplit[authorUrlSplit.indexOf("user") + 1];
    } else {
      authorFacebookID = null;
    }

    const authorName = authorUrl.innerText;

    const profileImgUrl = await page.evaluate(
      (p) => p.querySelector("image").attributes[5].textContent,
      post,
    );

    res.push({
      postID: postUrlSplit[postsInd + 1],
      post: msg,
      author: authorName,
      authorFacebookID,
      created: postDate,
      profileImgUrl,
    });
  }
  fs.writeFile("posts.json", JSON.stringify(res), { flag: "a+" }, (err) => {
    if (err) {
      throw err;
    }
    console.log("File is updated.");
  });

  // await browser.close();
})();
