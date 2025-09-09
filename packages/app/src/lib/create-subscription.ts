export type Observer<M> = (message: M) => void;

/**
 * A Simple subscription utility
 *
 * This function creates Observer Pattern
 * subscriptions. There are only 2 crucial parts,
 * the subscribe and notify function */
export function createSubscription<M>(opts?: { saveLastMsg?: boolean }) {
  // a Set of call backs functions
  const observers = new Set<Observer<M>>();
  let lastMessage: M | null = null;

  return {
    _observers: observers,
    subscribe(observer: Observer<M>) {
      if (lastMessage) {
        observer(lastMessage);
      }

      /**
       * Adds a new callback to be used
       * later in the notify function */
      observers.add(observer);

      return function unsubscribe() {
        observers.delete(observer);
      };
    },
    notify(message: M) {
      if (opts?.saveLastMsg) {
        lastMessage = message;
      }
      observers.forEach((obs) => obs(message));
    },
    destroy() {
      observers.clear();
    },
  };
}

export type CreateSubscriptionReturnType<M> = ReturnType<
  typeof createSubscription<M>
>;
