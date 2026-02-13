import subprocess
import os
import sys

def run_command(command, shell=False):
    print(f"Executing: {' '.join(command) if isinstance(command, list) else command}")
    try:
        result = subprocess.run(command, shell=shell, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error: {result.stderr}")
            return result.returncode, result.stdout, result.stderr
        return 0, result.stdout, result.stderr
    except Exception as e:
        print(f"Exception: {str(e)}")
        return 1, "", str(e)

def init_workspace():
    # 1. Create .tmp directory
    if not os.path.exists(".tmp"):
        print("Creating .tmp directory...")
        os.makedirs(".tmp")
    else:
        print(".tmp directory already exists.")

    # 2. Install Node dependencies
    print("Installing Node dependencies...")
    ret, out, err = run_command("npm install", shell=True)
    if ret != 0:
        print("Failed to install Node dependencies.")
        # sys.exit(1) # Don't exit yet, try Python deps

    # 3. Install Python dependencies
    if os.path.exists("requirements.txt"):
        print("Installing Python dependencies...")
        ret, out, err = run_command(["py", "-m", "pip", "install", "-r", "requirements.txt"])
        if ret != 0:
            print("Failed to install Python dependencies via 'py'. Trying 'pip'...")
            ret, out, err = run_command(["pip", "install", "-r", "requirements.txt"])
            if ret != 0:
                print("Failed to install Python dependencies.")

    # 4. Check for .env
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            print("Creating .env from .env.example...")
            with open(".env.example", "r") as f_in, open(".env", "w") as f_out:
                f_out.write(f_in.read())
        else:
            print("Warning: .env not found and .env.example missing.")
    else:
        print(".env already exists.")

    print("Workspace initialization complete!")

if __name__ == "__main__":
    init_workspace()
