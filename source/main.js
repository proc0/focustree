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

const EVENT_UPDATE = new Event('update')

customElements.define(
  'task-element',
  class extends HTMLElement {
    constructor() {
      super()

      const template = document.getElementById('task-template').content
      this.attachShadow({ mode: 'open' }).appendChild(template.cloneNode(true))

      this.shadowRoot
        .getElementById('task-edit')
        .addEventListener('click', (event) => {
          const nameInput = document.createElement('input')
          nameInput.setAttribute('type', 'text')

          const taskNameParent = event.currentTarget.parentElement
          taskNameParent.appendChild(nameInput)

          nameInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
              taskNameParent.removeChild(nameInput)
              this.task.task_name = nameInput.value
              EVENT_UPDATE.task = this.task
              EVENT_UPDATE.elementQuery = 'span[slot="task-name"]'
              this.dispatchEvent(EVENT_UPDATE)
            }
          })
          nameInput.focus()
        })
    }
  }
)

function renderTaskTree(task) {
  const taskName = document.createElement('span')
  taskName.setAttribute('slot', 'task-name')
  taskName.textContent = task.task_name

  const taskNote = document.createElement('span')
  taskNote.setAttribute('slot', 'task-note')
  taskNote.textContent = task.task_note

  const taskElement = document.createElement('task-element')
  taskElement.appendChild(taskName)
  taskElement.appendChild(taskNote)
  taskElement.task = task

  taskElement.addEventListener('update', (event) => {
    event.currentTarget.querySelector(event.elementQuery).textContent =
      event.task.task_name
  })

  if (!task.task_subs?.length) {
    const leafSubTasks = document.createElement('span')
    leafSubTasks.setAttribute('slot', 'task-leaf')
    taskElement.shadowRoot
      .getElementById('task-head')
      .setAttribute('class', 'task-leaf')
    taskElement.appendChild(leafSubTasks)
    return taskElement
  }

  for (const sub in task.task_subs) {
    const subTask = renderTaskTree(task.task_subs[sub])
    subTask.setAttribute('slot', 'task-subs')
    taskElement.appendChild(subTask)
  }

  return taskElement
}

const addTaskButton = document.getElementById('add-task')
addTaskButton.addEventListener('click', () => {
  main.appendChild(renderTaskTree(taskModel))
})

const main = document.getElementsByTagName('main')[0]
main.appendChild(renderTaskTree(taskTests))
