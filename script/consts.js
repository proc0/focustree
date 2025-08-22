// define states here and add them to the state list
// more states can be added
const STATE_READY = 'ready'
const STATE_ACTIVE = 'active'
const STATE_PAUSE = 'pause'
const STATE_DONE = 'done'

const STATES_TASK = [STATE_READY, STATE_ACTIVE, STATE_PAUSE, STATE_DONE]

// main menu
const ID_ROOT_ADD = 'root-add'
const ID_ROOT_IMPORT = 'root-import'
const ID_ROOT_EXPORT = 'root-export'
// global events
const EVENT_RENDER = 'render'
const EVENT_UPDATE = 'update'
const EVENT_BRANCH = 'branch'
const EVENT_DELETE = 'delete'
const EVENT_EXPAND = 'expand'
const EVENT_STATES = 'states'
const EVENT_FOCUS = 'focus'
const EVENT_SYNC = 'sync'
const EVENT_EDIT = 'edit'

// templates
//TODO: refactor names and make consistent
const TEMPLATE_NODE = 'template-task'
const TEMPLATE_COMPACT = 'template-task-compact'
const TEMPLATE_FOCUS = 'template-focus'
// custom element names
const ELEMENT_NODE = 'task-node'
const ELEMENT_BASE = 'task-base'
const ELEMENT_VIEW = 'task-view'
const ELEMENT_FOCUS = 'task-focus'
// html elements
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
