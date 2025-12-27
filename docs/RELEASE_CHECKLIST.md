# Release Checklist

Quick checklist for publishing Markdown for Humans to VS Code Marketplace.

## Pre-Release

### Code Quality
- [ ] Fix linting issues: `npm run lint:fix`
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build && npm run verify-build`

### Version & Tag
- [ ] Update `package.json` version
- [ ] Update `CHANGELOG.md` with new version section
- [ ] Commit all changes
- [ ] Create git tag: `git tag v<version>`
- [ ] Push tag: `git push origin v<version>`

### Package & Test
- [ ] Create package: `npm run package`
- [ ] Verify `.vsix` file created and size < 10MB
- [ ] Test local installation: `code --install-extension markdown-for-humans-<version>.vsix`
- [ ] Test core features in Extension Development Host:
  - [ ] WYSIWYG editing
  - [ ] Tables (create, resize, context menu)
  - [ ] Images (drag-drop, paste, resize)
  - [ ] Mermaid diagrams
  - [ ] Code blocks
  - [ ] Document outline sidebar
  - [ ] Toolbar formatting

### Documentation Review
- [ ] README.md - badges, links, features accurate
- [ ] CHANGELOG.md - version section complete, format correct
- [ ] Legal docs - "Last Updated" dates current (PRIVACY_POLICY, TERMS_OF_USE, EULA)

### Assets Review
- [ ] `icon.png` - 128x128 or 256x256, looks good on light/dark backgrounds
- [ ] Screenshots in `marketplace-assets/screenshots/` - high quality, showcase features

## Publication

### Marketplace Account
- [ ] Publisher account verified: https://marketplace.visualstudio.com/manage
- [ ] 2FA enabled on publishing account
- [ ] Personal Access Token created (scope: "Marketplace (Manage)")

### Publish
- [ ] Login: `vsce login concretio`
- [ ] Publish: `npm run publish`
- [ ] Or upload via web: https://marketplace.visualstudio.com/manage

### GitHub Release
- [ ] Create release: https://github.com/concretios/markdown-for-humans/releases/new
- [ ] Tag: `v<version>`
- [ ] Title: "v<version> - <description>"
- [ ] Description: Copy from CHANGELOG.md
- [ ] Attach `.vsix` file
- [ ] Mark as "Latest release"
- [ ] Publish

## Post-Release

- [ ] Extension appears in Marketplace
- [ ] All metadata correct
- [ ] Screenshots display correctly
- [ ] Links work
- [ ] Test installation from Marketplace URL
- [ ] Update README.md Marketplace badge/link if needed

---

**Quick Commands:**
```bash
# Full test cycle
npm run lint:fix && npm test && npm run build && npm run verify-build && npm run package

# Publish
vsce login concretio && npm run publish
```

