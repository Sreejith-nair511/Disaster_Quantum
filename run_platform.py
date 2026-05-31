import subprocess
import sys
import os
import time
import signal

def run():
    print("=" * 60)
    print("      AEGIS DISASTER INTELLIGENCE OPERATIONS PLATFORM")
    print("                 System Launcher Engine")
    print("=" * 60)
    
    # Check dependencies
    print("[INFO] Verifying backend packages...")
    try:
        import fastapi
        import uvicorn
        import sklearn
        import pandas
        import numpy
        print("[SUCCESS] Backend dependencies satisfied.")
    except ImportError as e:
        print(f"[WARNING] Some packages are missing. Try running: pip install -r backend/requirements.txt. Error details: {e}")
        
    backend_proc = None
    frontend_proc = None
    
    try:
        # 1. Start FastAPI Backend
        print("[START] Launching FastAPI Backend Server on http://localhost:8000...")
        backend_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--port", "8000"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # Give backend a moment to bind to the port and print startup logs
        time.sleep(2)
        
        # 2. Start Next.js Frontend
        print("[START] Launching Next.js Operations Dashboard on http://localhost:3000...")
        
        # On Windows, we use shell=True to execute npm script cleanly
        frontend_proc = subprocess.Popen(
            "npm run dev",
            cwd="frontend",
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        print("\n[SYSTEM] Both engines are running! Access the systems at:")
        print("  - Command Dashboard: http://localhost:3000")
        print("  - Backend Swagger UI: http://localhost:8000/docs")
        print("-" * 60)
        print("Press Ctrl+C to terminate both servers safely.\n")
        
        # Set processes to non-blocking and stream logs
        os.set_blocking(backend_proc.stdout.fileno(), False)
        os.set_blocking(frontend_proc.stdout.fileno(), False)
        
        while True:
            # Read backend logs
            try:
                line = backend_proc.stdout.readline()
                if line:
                    print(f"\033[36m[Backend]\033[0m {line.strip()}")
            except IOError:
                pass
                
            # Read frontend logs
            try:
                line = frontend_proc.stdout.readline()
                if line:
                    print(f"\033[35m[Frontend]\033[0m {line.strip()}")
            except IOError:
                pass
                
            # Check if any process terminated
            if backend_proc.poll() is not None:
                print("[FATAL] Backend server crashed unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("[FATAL] Frontend server crashed unexpectedly.")
                break
                
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        print("\n[STOP] Shutting down ADIOP control services...")
    finally:
        if backend_proc:
            print("[STOP] Killing FastAPI Backend...")
            backend_proc.terminate()
            backend_proc.wait()
        if frontend_proc:
            print("[STOP] Killing Next.js Frontend...")
            # On Windows, taskkill is safer for child node processes spawned via shell
            if os.name == 'nt':
                subprocess.run(f"taskkill /F /T /PID {frontend_proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                frontend_proc.terminate()
                frontend_proc.wait()
        print("[SUCCESS] Aegis systems offline.")

if __name__ == "__main__":
    run()
