const taskModel = {
  task_id: 0,
  task_name: 'New Task',
  task_note: 'This is a new task.',
  task_subs: [],
  task_state: 'in_progress',
  task_ui: {
    is_open: false,
  },
}

const taskTests = {
  task_id: '1',
  task_name: 'first task',
  task_note: 'first task details',
  task_state: 'idle',
  task_ui: {
    is_open: false,
  },
  task_subs: [
    {
      task_id: '2',
      task_name: 'second subtask',
      task_note: 'second task details',
      task_state: 'idle',
      task_ui: {
        is_open: false,
      },
      task_subs: [
        {
          task_id: '4',
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
      task_id: '3',
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

const CUSTOM_ELEMENT = 'task-element'
const ID_TEMPLATE = 'task-template'
const ELEMENT_TASK_FIELD = 'span'

const EVENT_UPDATE = 'update'

const QUERY_SLOT_FIELD = 'ul li slot'
const QUERY_SLOT_SUBS = 'details section'
const QUERY_BUTTON_ADD = 'button[name="task-add"]'
const QUERY_BUTTON_EDIT = 'button[name="task-edit"]'
const QUERY_BUTTON_DELETE = 'button[name="task-delete"]'

const ID_BUTTON_ROOT_ADD = 'root-add'
const ID_BUTTON_ROOT_SAVE = 'root-save'

const CLASS_BRANCH = 'branch'
const CLASS_LEAF = 'leaf'

const LABEL_BUTTON_SAVE = '✔'

customElements.define(
  CUSTOM_ELEMENT,
  class extends HTMLElement {
    constructor() {
      super()
      this.updateEvent = new CustomEvent(EVENT_UPDATE)

      this.attachShadow({ mode: 'open' }).appendChild(
        document.getElementById(ID_TEMPLATE).content.cloneNode(true)
      )

      // edit event for task fields
      this.shadowRoot.querySelectorAll(QUERY_SLOT_FIELD).forEach((slot) => {
        const editButton = slot.parentElement.querySelector(QUERY_BUTTON_EDIT)
        editButton.addEventListener('click', this.edit.bind(this))
      })
      // add event for subtasks
      this.shadowRoot.querySelector(QUERY_BUTTON_ADD).addEventListener('click', (event) => {
        const newTask = structuredClone(taskModel)
        newTask.task_id = this.task.task_id + 1 + this.task.task_subs.length

        this.task.task_subs.push(newTask)

        const updatedTaskElement = renderTaskTree(this.task)
        updatedTaskElement.setAttribute('slot', 'task-subs')
        updatedTaskElement.shadowRoot.querySelector('details').setAttribute('open', '')

        this.parentElement.replaceChild(updatedTaskElement, this)
      })
      //TODO: add a way to undo with ctrl+z, tombstone and hide instead? needs the data processing layer
      this.shadowRoot.querySelector(QUERY_BUTTON_DELETE).addEventListener('click', () => {
        if (this.parentElement.tagName === 'MAIN') {
          this.remove()
          return
        }

        const parentTask = this.parentElement.task
        for (const index in parentTask.task_subs) {
          if (parentTask.task_subs[index].task_id === this.task.task_id) {
            parentTask.task_subs.splice(index, 1)
            break
          }
        }

        const updatedTaskElement = renderTaskTree(parentTask)
        updatedTaskElement.setAttribute('slot', 'task-subs')

        // this promotes the task to the parent task...
        // this.parentElement.replaceWith(updatedTaskElement, this)
        this.parentElement.replaceWith(updatedTaskElement)
      })
      // record open state
      this.shadowRoot.querySelector('details summary').addEventListener('click', (event) => {
        const isOpen = !!event.currentTarget.getAttribute('open')
        this.task.task_ui.is_open = !isOpen
      })
    }

    commit(event) {
      const saveButton = event.currentTarget
      const parent = saveButton.parentElement
      const deleteButton = parent.querySelector(QUERY_BUTTON_DELETE)

      const slotName = parent.querySelector('slot').getAttribute('name')
      const fieldName = slotName.replace('-', '_')

      const input = parent.querySelector('input')
      this.task[fieldName] = input.value
      this.updateEvent.updateValue = input.value
      this.updateEvent.elementQuery = `${ELEMENT_TASK_FIELD}[slot="${slotName}"]`

      const editButton = parent.querySelector(QUERY_BUTTON_EDIT)
      parent.removeChild(input)
      parent.querySelector('slot').setAttribute('class', '')
      editButton.setAttribute('class', '')
      deleteButton?.setAttribute('class', '')
      saveButton.remove()

      this.dispatchEvent(this.updateEvent)
    }

    edit(event) {
      const editButton = event.currentTarget
      const parent = editButton.parentElement
      const deleteButton = parent.querySelector(QUERY_BUTTON_DELETE)

      const slotName = parent.querySelector('slot').getAttribute('name')
      const fieldName = slotName.replace('-', '_')

      if (parent.getElementsByTagName('input')?.length) return

      editButton.setAttribute('class', 'hidden')
      deleteButton?.setAttribute('class', 'hidden')
      parent.querySelector('slot').setAttribute('class', 'hidden')

      const inputElement = document.createElement('input')
      inputElement.setAttribute('type', 'text')
      inputElement.setAttribute('id', `${slotName}-${this.task.task_id}`)
      inputElement.setAttribute('value', this.task[fieldName])

      const saveButton = document.createElement('button')
      saveButton.textContent = LABEL_BUTTON_SAVE
      saveButton.addEventListener('click', this.commit.bind(this))

      parent.appendChild(inputElement)
      parent.appendChild(saveButton)

      inputElement.addEventListener('keyup', ({ key }) => {
        if (key === 'Enter') saveButton.click()
      })

      inputElement.focus()
    }
  }
)

function renderTaskTree(task) {
  const taskElement = document.createElement(CUSTOM_ELEMENT)
  taskElement.task = task

  taskElement.shadowRoot.querySelector('div').setAttribute('id', `task-${task.task_id}`)

  taskElement.addEventListener(EVENT_UPDATE, (event) => {
    event.currentTarget.querySelector(event.elementQuery).textContent = event.updateValue
  })

  // fields
  const taskName = document.createElement(ELEMENT_TASK_FIELD)
  taskName.setAttribute('slot', 'task-name')
  taskName.textContent = task.task_name
  taskElement.appendChild(taskName)

  const taskNote = document.createElement(ELEMENT_TASK_FIELD)
  taskNote.setAttribute('slot', 'task-note')
  taskNote.textContent = task.task_note
  taskElement.appendChild(taskNote)

  // leaf
  if (!task.task_subs?.length) {
    taskElement.shadowRoot.querySelector('div').setAttribute('class', CLASS_LEAF)
    return taskElement
  }

  // branch
  taskElement.shadowRoot.querySelector('div').setAttribute('class', CLASS_BRANCH)

  const subLength = task.task_subs.length
  const numSubs = document.createElement('span')
  numSubs.setAttribute('slot', 'num-subs')
  numSubs.textContent = `Subtasks (${subLength})`
  taskElement.appendChild(numSubs)

  for (const sub in task.task_subs) {
    const subTask = renderTaskTree(task.task_subs[sub])
    subTask.setAttribute('slot', 'task-subs')

    taskElement.appendChild(subTask)
  }

  if (task.task_ui.is_open) {
    taskElement.shadowRoot.querySelector('details').setAttribute('open', '')
  }

  return taskElement
}

const main = document.getElementsByTagName('main')[0]

const addTaskButton = document.getElementById(ID_BUTTON_ROOT_ADD)
addTaskButton.addEventListener('click', () => {
  main.appendChild(renderTaskTree(structuredClone(taskModel)))
})

main.appendChild(renderTaskTree(taskTests))
