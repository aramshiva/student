<img width="1048" height="630" alt="ScreenShot 2025-10-02 at 17 14 01@2x" src="https://github.com/aramshiva/student/blob/main/public/screenshots/gradebook.png" />

# Student

![](https://api.checklyhq.com/v1/badges/checks/15980c57-d0b5-4c51-9b62-24a3e916c70b?style=flat&theme=default) ![Time Spent Coding](https://hackatime-badge.hackclub.com/U0616280E6P/student) ![GitHub commit status](https://img.shields.io/github/checks-status/aramshiva/student/main) ![GitHub last commit](https://img.shields.io/github/last-commit/aramshiva/student)

Student is an alternative client for StudentVUE®, a popular school LMS software used in the US. It features a refreshed UI with more powerful features to help maintain academics.

<sub>StudentVUE® is a registered trademark of Edupoint Educational Systems, LLC. This project is not affiliated with Edupoint or Synergy.</sub>

The app features a gradebook, schedule, calendar, attendance, documents, mail, test history, and school information. It has a clean interface and powerful features like Hypothetical Mode to make use easier. Student does not store, see or keep any of your personal data, a full privacy policy can be read [here](https://student.aram.sh/privacy).

## Development
Student is a [Next.js](https://nextjs.org/) app, using [TypeScript](https://www.typescriptlang.org/). 
[Tailwind CSS](https://tailwindcss.com/) is used to make CSS easier and cleaner in the app using `class` (referenced as `className`) tags in the code. 

Student's interface uses [shadcn/ui](https://ui.shadcn.com/) as a foundation and component template.

Student uses multiple SOAP (and REST) based internal Synergy APIs, hosted on the student's district synergy server. Not all of these are documented, and I may document them later.

### Running locally
The student has no required environment variables, and running a development instance just requires starting a Next.js server. If you are not familiar with this, these steps will walk you through how to do it.

1. First, choose a package manager. I won't explain what they are as it's pretty common knowledge. For this example, I am going to use `bun` for this. Each package manager acts pretty similar.
2. Install the dependencies for the app, you can do this by running
  ```
  bun i
  ```
3. Next, spin up a development server.
  ```
  bun dev
  ```
  This should make a web server on your local machine which you can visit with the app. (it will say it on the `bun dev` command, default is port 3000)

4. Before pushing your code/making a pull request, make sure to build your code to make sure it works in production. This can simply be done by running
```
bun run build
```

#### Hosting
> [!IMPORTANT]  
> Student is hosted on a GNU-AGPLv3 license. The full license can be found [here](https://github.com/aramshiva/student/blob/main/LICENSE). Please keep it in mind when making changes or hosting.
This app is hosted by [Vercel](https://vercel.com), all commits to this repository will be pushed to Student through Vercel.

If you want to host yourself, I recommend Vercel as well. Their free plan is very generous and should be fine for most uses.

