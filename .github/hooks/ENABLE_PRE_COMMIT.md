# Enabling the Pre-Commit Hook

The pre-commit hook is currently **disabled** and saved as `pre-commit.disabled`.

## To Enable When Ready

1. **Rename the disabled hook to active:**
   ```bash
   mv .github/hooks/pre-commit.disabled .github/hooks/pre-commit
   ```

2. **Ensure it's executable:**
   ```bash
   chmod +x .github/hooks/pre-commit
   ```

3. **Install the hook:**
   ```bash
   npm run install-hooks
   ```

4. **Verify installation:**
   ```bash
   ls -l .git/hooks/pre-commit
   ```

## What the Hook Does

When enabled, the pre-commit hook will:
- Automatically run `npm run lint:fix` before each commit
- Check for remaining linting issues with `npm run lint`
- Block commits if linting fails (with helpful error messages)

## Current Status

- ✅ Hook implementation is complete
- ✅ Hook is saved as `pre-commit.disabled`
- ⚠️ Hook is **not active** (won't run on commits)
- 📝 Ready to enable when codebase is lint-clean

## Testing Before Enabling

Before enabling, ensure:
- [ ] Run `npm run lint:fix` manually and review all changes
- [ ] Run `npm run lint` and fix any remaining errors
- [ ] Verify build still works: `npm run build && npm run verify-build`
- [ ] Run tests: `npm test`
- [ ] All team members are aware of the hook

---

**Last Disabled:** 2025-12-25  
**Reason:** Codebase needs linting cleanup before automated checks

