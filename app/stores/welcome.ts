import { action, makeObservable, reaction } from 'mobx';

export class WelcomeStore {
  spaceLoading = {
    spaceName: undefined as unknown as string,
    leftTime: 0,
    progressModalOpen: false,
  };

  spaceLoadingTimeout = undefined as unknown as number;

  constructor() {
    makeObservable(this, {
      spaceLoading: true,
      setSpaceLoading: action,
    });
    reaction(
      () => this.spaceLoading,
      (spaceLoading) => {
        if (spaceLoading.leftTime <= 0) {
          this.spaceLoadingTimeout = undefined;
          return;
        }

        this.spaceLoadingTimeout = window.setTimeout(() => {
          this.spaceLoadingTimeout = undefined;
          this.setSpaceLoading({ leftTime: spaceLoading.leftTime - 1 });
        }, 1000);
      },
    );
  }

  setSpaceLoading = (payload: Partial<typeof this.spaceLoading>) => {
    this.spaceLoading = { ...this.spaceLoading, ...payload };
  };

  clearSpaceLoadingTimeout = () => this.spaceLoadingTimeout && window.clearTimeout(this.spaceLoadingTimeout);
}

const welcomeStore = new WelcomeStore();

export default welcomeStore;
