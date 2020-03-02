![title-image](https://user-images.githubusercontent.com/6937031/75204167-ff300e00-5724-11ea-8a22-721b8f5f97c5.gif)

## Overview

This repository is the companion to the article series [Advanced NestJS Microservices](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l) covering building a custom NestJS microservice transporter.

### Get the code

Get the repository by cloning [git@github.com:johnbiundo/nestjs-faye-transporter-sample.git](git@github.com:johnbiundo/nestjs-faye-transporter-sample.git)

```bash
$ # from the parent directory of where you want the project
$ git clone git@github.com:johnbiundo/nestjs-faye-transporter-sample.git transporter-tutorial
```

This clones the repository, which will grow to have multiple folders over the lifetime of the tutorial into a folder called `transporter-tutorial` (choose whatever name you like for this folder, but we'll reference this as the parent folder for the tutorial).

### Repository Structure

The repository is structured with multiple branches, each corresponding to an article in the series.

<table>
<tr>
<th>Branch</th><th>Article Link</th>
</tr>
<tr>
<td><code>part1</code></td><td><a href="https://dev.to/nestjs/part-1-introduction-and-setup-1a2l">Part 1: Introduction and Setup</a></td>
</tr>
<tr>
<td><code>part2</code></td><td><a href="https://dev.to/nestjs/part-1-introduction-and-setup-1a2l">Part 2: Basic Server Component</a></td>
</tr>
<tr>
<td><code>part3</code></td><td><a href="https://dev.to/nestjs/part-1-introduction-and-setup-1a2l">Part 3: Completing the Server Component</a></td>
</tr>
<tr>
<td><code>part4</code></td><td><a href="https://dev.to/nestjs/part-1-introduction-and-setup-1a2l">Part 4: Basic Client Component</a></td>
</tr>
<tr>
<td><code>part5</code></td><td><a href="https://dev.to/nestjs/part-1-introduction-and-setup-1a2l">Part 5: Completing the Client Component</a></td>
</tr>
<tr>
<td>(no new code)</td><td><a href="https://dev.to/nestjs/part-1-introduction-and-setup-1a2l">Part 6: Survey of Built-in Transporters</a></td>
</tr>
</table>

### Part 1: Introduction and Setup

This section corresponds to [Part 1 of the series](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l), and provides instructions for building and running the code in that section.

#### Checkout the Branch

For this section, you should be on branch `part1`:

```bash
$ # from the root folder (that you cloned into above)
$ git checkout part1
$ # build the artifacts
$ # note that this is a shell script so you may have to make adjustments
$ # if you're not on Linux, or fall back to running the individual
$ # `npm install` commands in each sub-directory
$ sh build.sh
```

#### Running the Code

The most useful exercise is to run the various components in multiple terminal windows: the Faye broker in one terminal, the `customerApp` native app in a second and the `customerService` native app in a third. As mentioned, [tmux is a great fit](https://github.com/johnbiundo/nest-nats-sample#pro-tip-use-tmux-optional) for this, but you can just run 3 separate terminals or tabs if you so desire.

**Terminal 1**: run the Faye broker.

```bash
$ # from faye-server directory
$ npm run start
```

This starts the Faye broker and displays its log, which you can use to observe the message traffic.

**Terminal 2**: run the `customerService` native app.

```bash
$ # from customerService directory
$ npm run start
```

This starts the `customerService` native app, which runs as a background server, and displays its log so you can monitor message traffic.

**Terminal 3**: run the `customerApp` native app.

This is a "command line" app where you can issue a command that sends a request to the `customerService` app via the Faye broker.

Here's an example of the commands you can issue. These commands have been packaged as NPM scripts to make it easy to run them.

```bash
$ # from customerApp directory
$ npm run get-customers
$ # npm run get-customers is an alias that runs `node dist/customerApp.js get`
$
$ # view the response
$ npm run add-customer "Nike, Inc."
$ #  npm run add-customer is an alias that runs `node dist/customerApp.js add`
$
$ npm run get-customers
$ # view the updated response
```

Here's what it looks like with three tmux panes stacked vertically.

![faye-basic-demo2](https://user-images.githubusercontent.com/6937031/75201170-9775c500-571c-11ea-8b7a-d9121c4418c1.gif)

### Part 2: Basic Server Component

This section corresponds to [Part 2 of the series](https://dev.to/nestjs/part-2-basic-server-component-5313-temp-slug-6221883?preview=2f3ceab6d03c32bc1d00e56a907f4c2e87b388b516d6009c5c72a6f5a31ef8da2a310c035b7b0a84cd9760ab2ac5d241dd2ceaceaf807ba1e745bbb9), and provides instructions for building and running the code in that section.

#### Checkout the Branch

For this part, you should be on branch `part2`:

```bash
$ # from the root folder (that you cloned into above)
$ git checkout part2
$ # build the artifacts
$ # note that this is a shell script so you may have to make adjustments
$ # if you're not on Linux, or fall back to running the individual
$ # `npm install` commands in each sub-directory
$ sh build.sh
```

The [article](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l) contains instructions for running various requests.

### Part 3: Completing the Server Component

This section corresponds to [Part 3 of the series](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l), and provides instructions for building and running the code in that section.

#### Checkout the Branch

For this part, you should be on branch `part3`:

```bash
$ # from the root folder (that you cloned into above)
$ git checkout part3
$ # build the artifacts
$ # note that this is a shell script so you may have to make adjustments
$ # if you're not on Linux, or fall back to running the individual
$ # `npm install` commands in each sub-directory
$ sh build.sh
```

At the end of this article, because we provided the `nestHttpApp` and a fully implementation of the Faye flavored `ClientProxy`, you now have a **fully working Faye Custom Transporter**.

You can test this end to end by issuing HTTP requests to the `nestHttpApp` like these (shown as HTTPie requests, but use your preferred client):

```bash
$ # Run the `GET /customers` request
$ http get localhost:3000/customers
```

```bash
$ # Run the `POST /customer` request to add a customer
$ http post localhost:3000/customer name="Acme, Inc."
```

Run the `GET /customers` request again to see it return the new customer.

With the verbose logging in place, it can be very helpful to observe the flow of messages between each of the active components in this setup to cement your understanding of how the pieces fit together.

#### Observables Side Trip

[In the article](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l) we make reference to a deep dive on handling observables. You can check out that [deep dive here](/observable-deepdive.md) any time you want. I encourage you to at least read the first section.

### Part 4: Initial Client Component

This section corresponds to [Part 4 of the series](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l), and provides instructions for building and running the code in that section.

#### Checkout the Branch

For this part, you should be on branch `part4`:

```bash
$ # from the root folder (that you cloned into above)
$ git checkout part4
$ # build the artifacts
$ # note that this is a shell script so you may have to make adjustments
$ # if you're not on Linux, or fall back to running the individual
$ # `npm install` commands in each sub-directory
$ sh build.sh
```

[The article](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l) provides instructions for running various tests.

### Part 5: Final Client Component

This section corresponds to [Part 5 of the series](https://dev.to/nestjs/part-1-introduction-and-setup-1a2l), and provides instructions for building and running the code in that section.

#### Checkout the Branch

For this part, you should be on branch `part5`:

```bash
$ # from the root folder (that you cloned into above)
$ git checkout part5
$ # build the artifacts
$ # note that this is a shell script so you may have to make adjustments
$ # if you're not on Linux, or fall back to running the individual
$ # `npm install` commands in each sub-directory
$ sh build.sh
```

At the end of this article, you have a **complete, fully functional Faye transporter**. You should be able to run any of the routes successfully. Refer above to the previous sections for various samples, such as [Part 3](#part-3-completing-the-server-component). You can also explore the routes presented in the `nestHttpApp` controller, and run each of these. [This page](/observable-deepdive.md) also presents some interesting advanced test cases (which are present in the routes in this branch).
