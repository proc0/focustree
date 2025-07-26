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
      task_id: 1,
      task_path: [0, 0],
      task_name: 'Complete a task',
      task_note: 'Click on the done button to complete a task.',
      task_state: 'idle',
      task_ui: {
        is_open: false,
      },
      task_subs: [
        {
          task_id: 1,
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
      task_id: 1,
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

// global consts
const EVENT_UPDATE = 'update'
const EVENT_BRANCH = 'branch'
const EVENT_DELETE = 'delete'
const EVENT_EXPAND = 'expand'

const ID_BUTTON_ROOT_ADD = 'root-add'
const ID_BUTTON_ROOT_SAVE = 'root-save'

const TASK_RENDER = 'task-render'

// task-element consts
const TASK_ELEMENT = 'task-element'
const ID_TEMPLATE = 'task-template'
const LABEL_BUTTON_SAVE = '✔'

const QUERY_SLOT_FIELD = 'ul li slot'
// const QUERY_SLOT_SUBS = 'details section'
const QUERY_BUTTON_ADD = 'button[name="task-add"]'
const QUERY_BUTTON_EDIT = 'button[name="task-edit"]'
const QUERY_BUTTON_DELETE = 'button[name="task-delete"]'

// task-element + renderTaskTree consts
const ELEMENT_TASK_FIELD = 'span'

// renderTaskTree consts
const CLASS_BRANCH = 'branch'
const CLASS_LEAF = 'leaf'

// taskbase + task-element consts
const TASK_BASE_ELEMENT = 'task-base'

// taskbase consts
const TASKBASE_NAME = 'taskbase'
const TASKBASE_VERSION = 1
const TASKBASE_STORE = 'task'
const TASKBASE_INDEX = 'roots'
