import { Toaster } from "react-hot-toast";

export function ToastContainer() {
    return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#333',
                    color: '#fff',
                },
                success: {
                    duration: 3000,
                    iconTheme: {
                        primary: '#4CAF50',
                        secondary: '#fff',
                    },
                },
                error: {
                    duration: 4000,
                    iconTheme: {
                        primary: '#f44336',
                        secondary: '#fff',
                    },
                },
            }}
        />
    );
}