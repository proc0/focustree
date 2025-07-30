const STATE_TASK = {
  DEFINED: 'defined',
  DOING: 'doing',
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
// custom element names
const ELEMENT_NODE = 'task-node'
const ELEMENT_BASE = 'task-base'
const ELEMENT_VIEW = 'task-view'
const ELEMENT_FIELD = 'span'
const ELEMENT_LABEL = 'span'
// slot names, should match html
const SLOT_SUBS = 'task-subs'
const SLOT_NAME = 'task-name'
const SLOT_NOTE = 'task-note'
const SLOT_TITLE_SUBS = 'title-subs'
const SLOT_SAVE = 'task-save'
const SLOT_STATE = 'task-state'
// text and labels
const TEXT_SAVE = '✔'
const TEXT_SUBS = 'Subtasks'
