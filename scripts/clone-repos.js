const path = require('path')
const fs = require('fs-extra')
const rimraf = require('rimraf').rimraf
const execa = require('execa')


const projectNames = [
  {
    name: 'ts/typescript-tutorial',
    repo:
      'https://github.com/xcatliu/typescript-tutorial.git',
    branch: 'vivo'
  },
]

const cwd = path.resolve(__dirname, '..')

const run = async () => {
    for (let i = 0; i < projectNames.length; i++) {
        const project = projectNames[i]
        const projectDir = path.resolve(cwd, project.name)
        await rimraf(projectDir)
        const { name, repo, branch } = project
        const cloneCmd = `git clone ${repo} ${name}`
        console.log(cloneCmd)
        await execa('git', ['clone', '--depth=1', repo, `${name}`], {
          cwd,
          stdio: 'inherit'
        })
        console.log(`rm -rf ${projectDir}/.git`)
        await execa('rm', ['-rf', `${projectDir}/.git`], { cwd: projectDir, stdio: 'inherit' })
    }
}

run()
