// import React, { Component } from 'react';

// class ErrorBoundary extends Component {
//     constructor(props) {
//         super(props);
//         this.state = {
//             hasError: false,
//             error: null,
//             errorInfo: null
//         };
//     }

//     static getDerivedStateFromError(error) {
//         // Update state so the next render will show the fallback UI
//         return { hasError: true };
//     }

//     componentDidCatch(error, errorInfo) {
//         // You can log the error to an error reporting service
//         console.error("Error caught by ErrorBoundary:", error, errorInfo);
//         this.setState({
//             error: error,
//             errorInfo: errorInfo
//         });
//     }

//     render() {
//         if (this.state.hasError) {
//             // You can render any custom fallback UI
//             return (
//                 <div className="error-boundary">
//                     <h2>Something went wrong.</h2>
//                     <details style={{ whiteSpace: 'pre-wrap' }}>
//                         {this.state.error && this.state.error.toString()}
//                         <br />
//                         {this.state.errorInfo && this.state.errorInfo.componentStack}
//                     </details>
//                     {this.props.fallback}
//                 </div>
//             );
//         }

//         // If there's no error, render children normally
//         return this.props.children;
//     }
// }

export default function ErrorBoundary() {
    return (
        <div><h1>ErrorBoundary</h1></div>
    )
};