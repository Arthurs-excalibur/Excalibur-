import simpleGit, { SimpleGit } from 'simple-git';

export class GitTools {
  private git: SimpleGit;

  constructor(workspacePath: string) {
    this.git = simpleGit(workspacePath);
  }

  async commitChanges(message: string): Promise<void> {
    const isRepo = await this.git.checkIsRepo();
    if (!isRepo) {
      await this.git.init();
    }
    
    await this.git.add('.');
    await this.git.commit(message);
  }
}
