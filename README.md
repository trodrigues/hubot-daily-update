hubot-daily-update
===================

Use Hubot to save your daily team updates

## What does it do?

For each chat room, you can ask Hubot to store daily status updates for
your team.

Each user can store their status updates which are saved automatically
for the current day.

You can retrieve status updates for the current or previous days.

The output is tailored for Slack and assumes existence of Markdown's code
markers, but should work well for others as well.

Use together with [hubot-standup-alarm](https://github.com/hubot-scripts/hubot-standup-alarm) so you can be reminded to do your updates.

## Usage

`hubot daily update help` - List of commands

`hubot my update is` - Tell hubot about an update. You can tell hubot about how many updates you want in a day.

`hubot get daily updates for user` - Gets all of today's updates for a user

`hubot get all daily updates` - Gets all daily updates for all users for today

`hubot get all daily updates for yesterday` - Gets all daily updates for all users for yesterday

`hubot get all daily updates for X days ago` - Gets all daily updates for all users for X days ago

## Installation via NPM

Run the following command to install this module as a Hubot dependency

```
npm install hubot-daily-update --save
```

To enable the script, add the hubot-daily-update entry to the external-scripts.json file (you may need to create this file).

```
  ["hubot-daily-update"]
```

## Acknowledgements

Shamelessly based off the [hubot-standup-alarm](https://github.com/hubot-scripts/hubot-standup-alarm) plugin
