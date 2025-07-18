customElements.define(
  'element-details',
  class extends HTMLElement {
    constructor() {
      super()
      const template = document.getElementById(
        'element-details-template'
      ).content
      this.attachShadow({ mode: 'open' }).appendChild(template.cloneNode(true))
    }
  }
)

const testObj = {
  task_id: '1',
  task_name: 'first task',
  task_details: 'first task details',
  task_fields: ['field1', 'field2'],
  field1: 'value1',
  field2: 'value2',
  task_subs: [
    {
      task_id: '2',
      task_name: 'second subtask',
      task_details: 'second task details',
      task_fields: ['field3', 'field4'],
      field3: 'value3',
      field4: 'value4',
      task_subs: [
        {
          task_id: '4',
          task_name: 'sub subtask',
          task_details: 'sub sub task details',
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
      task_details: 'third task details',
      task_fields: ['field5', 'field6'],
      field3: 'value5',
      field4: 'value6',
      task_subs: [],
    },
  ],
}

function renderTaskTree(task) {
  const taskElement = document.createElement('element-details')
  const taskTitle = document.createElement('div')
  taskTitle.setAttribute('slot', 'title')
  taskTitle.textContent = task.task_name
  taskElement.appendChild(taskTitle)

  const taskDetails = document.createElement('div')
  taskDetails.setAttribute('slot', 'description')
  taskDetails.textContent = task.task_details
  taskElement.appendChild(taskDetails)

  for (const sub in task.task_subs) {
    const subtask = renderTaskTree(task.task_subs[sub])
    subtask.setAttribute('slot', 'attributes')
    taskElement.appendChild(subtask)
  }
  return taskElement
}

const main = document.getElementsByTagName('main')[0]

main.appendChild(renderTaskTree(testObj))
