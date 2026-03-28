import { Component, type ErrorInfo, type ReactNode } from 'react';
import { toast } from 'sonner';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
    toast.error(error.message || 'Неожиданная ошибка');
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold mb-2">Что-то пошло не так</h1>
          <button className="btn-primary" onClick={() => location.reload()}>
            Перезагрузить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
