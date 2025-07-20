const taskModel = {
  task_id: 0,
  task_name: 'New Task',
  task_note: 'This is a new task.',
  task_fields: [],
  task_subs: [],
}

const taskTests = {
  task_id: '1',
  task_name: 'first task',
  task_note: 'first task details',
  task_fields: ['field1', 'field2'],
  field1: 'value1',
  field2: 'value2',
  task_subs: [
    {
      task_id: '2',
      task_name: 'second subtask',
      task_note: 'second task details',
      task_fields: ['field3', 'field4'],
      field3: 'value3',
      field4: 'value4',
      task_subs: [
        {
          task_id: '4',
          task_name: 'sub subtask',
          task_note: 'sub sub task details',
          task_fields: ['field3.1', 'field4.1'],
          field3: 'value3.1',
          field4: 'value4.1',
          task_subs: [],
        },
      ],
    },
    {
      task_id: '3',
      task_name: 'third subtask',
      task_note: 'third task details',
      task_fields: ['field5', 'field6'],
      field3: 'value5',
      field4: 'value6',
      task_subs: [],
    },
  ],
}

const CUSTOM_ELEMENT = 'task-element'
const TEMPLATE_ID = 'task-template'

const EVENT_UPDATE = 'update'

const QUERY_SLOT_FIELD = 'ul li slot'
const QUERY_BUTTON_ADD = 'details summary button'
const QUERY_SUB_SECTION = 'details section'

const CLASS_LEAF = 'leaf'

const LABEL_BUTTON_SAVE = 'Save'

customElements.define(
  CUSTOM_ELEMENT,
  class extends HTMLElement {
    constructor() {
      super()
      this.updateEvent = new CustomEvent(EVENT_UPDATE)

      this.attachShadow({ mode: 'open' }).appendChild(
        document.getElementById(TEMPLATE_ID).content.cloneNode(true)
      )

      this.shadowRoot.querySelectorAll(QUERY_SLOT_FIELD).forEach((slot) => {
        const editButton = slot.parentElement.querySelector('button')
        editButton.addEventListener('click', this.onEditButtonClick.bind(this))
      })

      this.shadowRoot
        .querySelector(QUERY_BUTTON_ADD)
        .addEventListener('click', (event) => {
          const newTask = structuredClone(taskModel)
          newTask.task_id = this.task.task_id + 1
          const subTask = renderTaskTree(newTask)
          subTask.setAttribute('slot', 'task-subs')
          this.shadowRoot.querySelector('div').setAttribute('class', '')
          this.shadowRoot.querySelector(QUERY_SUB_SECTION).appendChild(subTask)
        })
    }

    commit(event) {
      const saveButton = event.currentTarget
      const parentElement = saveButton.parentElement
      const inputElement = parentElement.getElementsByTagName('input')[0]
      const editButton = parentElement.querySelector('button[name="edit"]')
      const slotName = parentElement.querySelector('slot').getAttribute('name')
      const fieldName = slotName.replace('-', '_')

      this.task[fieldName] = inputElement.value
      this.updateEvent.updateValue = inputElement.value
      this.updateEvent.elementQuery = `span[slot="${slotName}"]`

      parentElement.removeChild(inputElement)
      parentElement.querySelector('slot').setAttribute('class', '')
      editButton.setAttribute('class', '')
      saveButton.remove()

      this.dispatchEvent(this.updateEvent)
    }

    onEditButtonClick(event) {
      const currentButton = event.currentTarget
      const parentElement = currentButton.parentElement
      const slotName = parentElement.querySelector('slot').getAttribute('name')
      const fieldName = slotName.replace('-', '_')

      if (parentElement.getElementsByTagName('input')?.length) return

      currentButton.setAttribute('class', 'hidden')
      parentElement.querySelector('slot').setAttribute('class', 'hidden')

      const inputElement = document.createElement('input')
      inputElement.setAttribute('type', 'text')
      inputElement.setAttribute('value', this.task[fieldName])

      const saveButton = document.createElement('button')
      saveButton.textContent = LABEL_BUTTON_SAVE
      saveButton.addEventListener('click', this.commit.bind(this))

      parentElement.appendChild(inputElement)
      parentElement.appendChild(saveButton)

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

  taskElement.addEventListener(EVENT_UPDATE, (event) => {
    event.currentTarget.querySelector(event.elementQuery).textContent =
      event.updateValue
  })

  const taskName = document.createElement('span')
  taskName.setAttribute('slot', 'task-name')
  taskName.textContent = task.task_name
  taskElement.appendChild(taskName)

  const taskNote = document.createElement('span')
  taskNote.setAttribute('slot', 'task-note')
  taskNote.textContent = task.task_note
  taskElement.appendChild(taskNote)

  // task leaf
  if (!task.task_subs?.length) {
    taskElement.shadowRoot
      .querySelector('div')
      .setAttribute('class', CLASS_LEAF)
    return taskElement
  }

  // task subs
  for (const sub in task.task_subs) {
    const subTask = renderTaskTree(task.task_subs[sub])
    subTask.setAttribute('slot', 'task-subs')

    taskElement.appendChild(subTask)
  }

  return taskElement
}

const main = document.getElementsByTagName('main')[0]

const addTaskButton = document.getElementById('add-task')
addTaskButton.addEventListener('click', () => {
  const newTask = structuredClone(taskModel)
  newTask.task_id = taskModel.task_id + 1
  main.appendChild(renderTaskTree(newTask))
})

main.appendChild(renderTaskTree(taskTests))
