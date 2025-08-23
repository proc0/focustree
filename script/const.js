//placeholder
TUTORIAL = null

// more states can be added
const STATE_READY = 'ready'
const STATE_ACTIVE = 'active'
const STATE_PAUSE = 'pause'
const STATE_DONE = 'done'
// define states above and add them to the state list
const STATES = [STATE_READY, STATE_ACTIVE, STATE_PAUSE, STATE_DONE]

// global events
const EVENT_RENDER = 'render'
const EVENT_UPDATE = 'update'
const EVENT_BRANCH = 'branch'
const EVENT_DELETE = 'delete'
const EVENT_EXPAND = 'expand'
const EVENT_STATUS = 'status'
const EVENT_FOCUS = 'focus'
const EVENT_SYNC = 'sync'
const EVENT_EDIT = 'edit'
// main menu
const ID_ROOT_ADD = 'root-add'
const ID_ROOT_IMPORT = 'root-import'
const ID_ROOT_EXPORT = 'root-export'
// custom html templates
const TEMPLATE_NODE = 'template-task'
const TEMPLATE_EDIT = 'template-edit'
const TEMPLATE_FOCUS = 'template-focus'
// custom element tag names
const TAG_NODE = 'task-node'
const TAG_BASE = 'task-base'
const TAG_VIEW = 'task-view'
// html elements for slots
const TAG_FIELD = 'span'
const TAG_LABEL = 'span'
// slot names, should match html
const SLOT_TREE = 'task-tree'
const SLOT_NAME = 'task-name'
const SLOT_NOTE = 'task-note'
const SLOT_SAVE = 'task-save'
const SLOT_STATE = 'task-state'
const SLOT_TITLE_TREE = 'tree-title'
