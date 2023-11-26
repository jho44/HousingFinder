## HousingFinder

This was a project I started because I, and others I know, were frustrated by how difficult it was to search through Facebook Housing Groups for roommates / leases. In Facebook, ctrl-f doesn't work and there's no way to filter based on price ranges and such (since that's not what Facebook was made for). HousingFinder solves all of these problems and, at the time of writing this, is hosted [here](https://housing-finder.vercel.app). If it's no longer hosted by the time you find this repo, it's because of a number of factors (e.g., potential non-compliance with various policies since we're scraping posts rather than retrieving them via the FB API). If you think it should be revived, though, consider leaving a donation [here](https://ko-fi.com/housingfinder).

### Tech stack

- Next.js -- frontend / backend
- Vercel -- deployment
- GPT -- extract entities from Facebook posts
- MongoDB -- DB

### Things to improve / do

deployment

- [ ] dedicated IP addr for vercel https://vercel.com/guides/how-to-allowlist-deployment-ip-address

backend

- [ ] make the scraper work in headless mode
- [ ] scrape FB group posts via cron job
- [ ] redis cache entity extraction
- [ ] track other FB groups

frontend

- [ ] amenities dropdown
- [ ] better looking loading screen
- [ ] include any necessary legal text on home page
- [ ] enable users to suggest other features or provide feedback
- [ ] code improvements
  - [ ] useContext
  - [ ] clean up styles
- [ ] transitions / animations
  - [ ] make the feed move downwards whenever a popover opens
- [ ] update page immediately when new post comes in
- [ ] enable hiding posts
  - [ ] need another section to show hidden ones

database

- [ ] figure out how to scale the db
  - https://www.mongodb.com/basics/scaling

### Final notes

This project currently works by manually triggering the scraping in non-headless mode. That code can be found in `lib/scrape/index.js` and can be run with simply `node index.js` (after installing the proper packages).
