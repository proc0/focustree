const NEW_TASK = {
  task_id: 0,
  task_path: [0],
  task_name: 'New Task',
  task_note: 'This is a new task.',
  task_subs: [],
  task_state: 'in_progress',
  task_ui: {
    is_open: false,
  },
}

const SEED_TASK = {
  task_id: 1,
  task_path: [0],
  task_name: 'Tutorial',
  task_note: 'First steps for using Focus Tree.',
  task_state: 'idle',
  task_ui: {
    is_open: true,
  },
  task_subs: [
    {
      task_path: [0, 0],
      task_name: 'Complete a task',
      task_note: 'Click on the done button to complete a task.',
      task_state: 'idle',
      task_ui: {
        is_open: false,
      },
      task_subs: [
        {
          task_path: [0, 1, 0],
          task_name: 'sub subtask',
          task_note: 'sub sub task details',
          task_state: 'idle',
          task_ui: {
            is_open: false,
          },
          task_subs: [],
        },
      ],
    },
    {
      task_path: [0, 1],
      task_name: 'third subtask',
      task_note: 'third task details',
      task_state: 'idle',
      task_ui: {
        is_open: false,
      },
      task_subs: [],
    },
  ],
}

const STATE_TASK = {
  IDLE: 'idle',
  DOING: 'doing',
  FOCUS: 'focus',
  DONE: 'done',
}

// main menu
const ID_ROOT_ADD = 'root-add'
const ID_ROOT_SAVE = 'root-save'
// global events
const EVENT_UPDATE = 'update'
const EVENT_BRANCH = 'branch'
const EVENT_DELETE = 'delete'
const EVENT_EXPAND = 'expand'
const EVENT_RENDER = 'render'

const TEMPLATE_NODE = 'task-template'
// custom elements
const ELEMENT_NODE = 'task-node'
const ELEMENT_BASE = 'task-base'
const ELEMENT_VIEW = 'task-view'
const ELEMENT_FIELD = 'span'
const ELEMENT_LABEL = 'span'
// slot names
const SLOT_SUBS = 'task-subs'
const SLOT_NAME = 'task-name'
const SLOT_NOTE = 'task-note'
const SLOT_SUBCOUNT = 'num-subs'
// text and labels
const TEXT_SAVE = '✔'
const TEXT_SUBS = 'Subtasks'
