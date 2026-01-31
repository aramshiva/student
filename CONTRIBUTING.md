# Contributing
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

### API Documentation
In a local environment, go to `localhost:3000/docs` to see a swagger page for API docs. You can also just simply go to the `/app/api/synergy/` folder and see the code for each endpoint themselves.
#### Hosting
> [!IMPORTANT]  
> Student is hosted on a GNU-AGPLv3 license. The full license can be found [here](https://github.com/aramshiva/student/blob/main/LICENSE). Please keep it in mind when making changes or hosting.
This app is hosted by [Vercel](https://vercel.com), all commits to this repository will be pushed to Student through Vercel.

If you want to host yourself, I recommend [Vercel](https://vercel.com) as well. Their free plan is very generous and should be fine for most uses.

