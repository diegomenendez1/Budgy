import subprocess
import sys

def run_git_command(command):
    print(f"Executing: {' '.join(command)}")
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return result.returncode, result.stdout, result.stderr
    return 0, result.stdout, result.stderr

def sync_github():
    # 1. git status
    print("Checking status...")
    ret, out, err = run_git_command(["git", "status"])
    if ret != 0:
        print("Failed to get git status.")
        sys.exit(1)
    
    # Check if there are changes to commit
    if "nothing to commit, working tree clean" in out and "Your branch is up to date" in out:
        print("Everything is up to date. Attempting pull anyway to be sure.")
    
    # 2. git add .
    print("Adding changes...")
    ret, out, err = run_git_command(["git", "add", "."])
    if ret != 0:
        sys.exit(1)

    # Check for changes to commit
    ret, out, err = run_git_command(["git", "status"])
    if "Changes to be committed:" in out:
        # 3. git commit
        commit_message = "Sync changes via Antigravity agent"
        print(f"Committing changes with message: {commit_message}")
        ret, out, err = run_git_command(["git", "commit", "-m", commit_message])
        if ret != 0:
            print("Commit failed.")
            sys.exit(1)
    else:
        print("No changes to commit.")

    # 4. git pull
    print("Pulling from remote...")
    ret, out, err = run_git_command(["git", "pull", "origin", "main"]) # Assuming main, can be improved to detect current branch
    if ret != 0:
        if "CONFLICT" in out or "CONFLICT" in err:
            print("CRITICAL: Merge conflicts detected. Manual resolution required.")
            sys.exit(1)
        print("Pull failed. Branch might be different or network issue.")
        # Try to detect branch
        ret_b, out_b, err_b = run_git_command(["git", "branch", "--show-current"])
        branch = out_b.strip()
        if branch and branch != "main":
            print(f"Retrying pull for branch: {branch}")
            ret, out, err = run_git_command(["git", "pull", "origin", branch])
            if ret != 0:
                print("Pull failed again.")
                sys.exit(1)
        else:
            sys.exit(1)

    # 5. git push
    print("Pushing to remote...")
    ret_b, out_b, err_b = run_git_command(["git", "branch", "--show-current"])
    branch = out_b.strip()
    ret, out, err = run_git_command(["git", "push", "origin", branch])
    if ret != 0:
        print("Push failed. Check for protected branch or credentials.")
        sys.exit(1)

    print("Synchronization successful!")

if __name__ == "__main__":
    sync_github()
