# CONTRIBUTING
Student is open-source (which means the code is open for anyone to contribute to or read), and we welcome all PRs!

Student is written in Next.js (a framework built on top of react), Tailwind CSS (a CSS class framework) and internal Synergy APIs.

To run the site locally (to help contribute), install [Bun](https://bun.sh/) (a package manager, but you can use your own package manager if you want!), then fork the repository and go to the directory path in your terminal, then type in:
```
bun i
```
This will install all dependencies used by Student, now we're ready to start up the development server! Run:
```
bun dev
```
will start up your development server! Now you can go to localhost:3000 (if that port was free when you ran `bun dev`) to see Student in action, editing the code should update live (thanks to Next.js!)

If you want to build your app, run:
```
bun run build
```
This builds the app, and checks for errors + lints. If you want to see your built result, run:
```
bun start
```
