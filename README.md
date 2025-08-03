# Focus Tree

Task manager, action tracker, habit builder

//META TODO: ADD THIS LIST TO THE INITIAL SEED
//TODO: add readme info
//TODO: add favicon
//TODO: add packaging into one or two files in a build/dist folder

//FIXED: add subtask twice in a row and open state is not saved on refresh
//FIXED: root tasks open/close drawer does not persist into DB???
//DONE: encapsulate the render function, could be an event listener on main tag, let other events bubble up, remove it completely from taskBase
//DONE: rename taskrender to taskview, and other renaming
//DONE: add better render transition so it does not flash unstyled elements
//DONE: add task state and widget to change it

## Features

- Create infinite task trees
- Focus Mode - focus on any task tree and walk through it step by step
- Export and import task trees for unlimited use cases
- Dead simple and transparent implementation for maximum flexibility

## Tech features

- VanillaJS, HTML5, CSS3
- Extremely simple, no dependencies
- IndexedDB, local first (local only for now. Can be easily made to sync with PouchDB)
- Using supported DOM features like Slots and ShadowRoot to support rich functionality
