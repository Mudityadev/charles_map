"use client";

import * as React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error | null };

export default class KonvaErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('KonvaErrorBoundary caught an error', error, info);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 text-yellow-900 dark:text-yellow-200">
          <h3 className="font-semibold">Konva initialization error</h3>
          <p className="mt-2 text-sm">
            Konva failed to initialize in this browser. This is commonly caused by browser privacy shields
            (for example, Brave&rsquo;s Shield) blocking APIs Konva relies on. Please disable Shields for this site
            or open the editor in another browser.
          </p>

          <ul className="mt-2 text-sm list-disc pl-5">
            <li>In Brave: click the lion icon in the address bar and turn off Shields for this site.</li>
            <li>After changing settings, use <strong>Reload</strong> or <strong>Retry</strong> below.</li>
          </ul>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => location.reload()}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Reload
            </button>
            <button onClick={this.reset} className="px-3 py-1 border rounded">
              Retry
            </button>
          </div>

          <details className="mt-3 text-xs text-gray-700 dark:text-gray-300">
            <summary>Show error</summary>
            <pre className="whitespace-pre-wrap">{String(this.state.error)}</pre>
          </details>
        </div>
      );
    }

    return this.props.children as React.ReactNode;
  }
}
