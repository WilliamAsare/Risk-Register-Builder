# Risk Register Builder - User Manual

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Registration & Login](#registration--login)
4. [Dashboard](#dashboard)
5. [Creating a Risk Register](#creating-a-risk-register)
6. [Managing Risks](#managing-risks)
7. [Heat Map](#heat-map)
8. [Analytics](#analytics)
9. [Risk Detail Panel](#risk-detail-panel)
10. [Assets, Threats & Controls](#assets-threats--controls)
11. [Editing a Register](#editing-a-register)
12. [Clone Register](#clone-register)
13. [CSV Import](#csv-import)
14. [PDF & Excel Export](#pdf--excel-export)
15. [Search](#search)
16. [Collaboration & Sharing](#collaboration--sharing)
17. [Scoring Guide Reference](#scoring-guide-reference)

---

## Overview

Risk Register Builder is a full-stack GRC (Governance, Risk & Compliance) application designed for IT auditors, CISOs, and GRC professionals. It provides a structured workflow for identifying, assessing, and managing information security risks across multiple frameworks.

### Key Features
- 6-step guided risk register wizard with framework templates
- Interactive 5x5 risk heat map with configurable risk appetite
- Real-time analytics dashboards with 4 chart types
- Professional PDF and Excel report generation
- Full audit trail with field-level change tracking
- Role-based collaboration (owner, editor, viewer)
- Global risk search across all registers
- CSV bulk import for rapid risk population

### Supported Frameworks
- **NIST CSF 2.0** - Cybersecurity framework with Govern, Identify, Protect, Detect, Respond, Recover functions
- **ISO 27001** - Information security management system (ISMS) controls
- **SOX ITGC** - IT general controls for Sarbanes-Oxley compliance
- **General** - Start from scratch with no pre-populated data

---

## Getting Started

### System Requirements
- A modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection (for hosted version)

### Accessing the Application
Navigate to your deployment URL or `http://localhost:5173` for local development. You will see the landing page with options to sign in or create an account.

---

## Registration & Login

### Creating an Account
1. Click **"Get Started"** or **"Sign up"** on the landing/login page
2. Enter your **full name**, **email address**, and **password** (minimum 8 characters)
3. Optionally enter your **organization name**
4. Click **"Create Account"**
5. You will be automatically signed in and redirected to the dashboard

### Signing In
1. Click **"Sign In"** on the landing page
2. Enter your registered **email** and **password**
3. Click **"Sign In"**
4. Sessions last 24 hours before requiring re-authentication

### Signing Out
Click **"Sign out"** in the top-right corner of the navigation bar.

---

## Dashboard

The dashboard is your home screen after logging in. It displays:

### Risk Overview Chart
A donut chart showing the proportion of **Critical** vs **Other** risks across all your registers, with a total risk count in the center.

### Risks by Register Chart
A bar chart comparing the number of risks in each register, color-coded by risk level.

### Register Cards
Each register appears as a card showing:
- **Register name** and **framework badge**
- **Total risks**, **Critical count**, and **Open count**
- **Risk distribution bar** (visual breakdown by severity)
- **Last updated date**
- **Delete button** (trash icon) - for register owners only
- **Open** link to view the full register

### Filters
- **Framework filter** - Show only registers of a specific framework
- **Risk level filter** - Show only registers containing risks at a specific level

### Creating a New Register
Click the **"+ New Risk Register"** button in the top-right corner to launch the creation wizard.

---

## Creating a Risk Register

The creation wizard guides you through 6 steps. You can navigate between completed steps using the progress bar at the top.

### Step 1: Register Information
- **Register Name** (required) - A descriptive name for this assessment
- **Description** - Scope and purpose of the risk register
- **Framework** - Select a template: NIST CSF 2.0, ISO 27001, SOX ITGC, or General
  - Selecting a framework pre-populates assets, threats, and controls in subsequent steps

### Step 2: Assets
Identify the assets within scope of your assessment. Pre-populated assets appear based on your framework selection.

For each asset:
- **Name** (required) - e.g., "Cloud Infrastructure", "Network Infrastructure"
- **Type** - Application, Infrastructure, or Data
- **Owner** - Team or individual responsible
- **Criticality** - Critical, High, Medium, or Low

Click **"+ Add Asset"** to add custom assets. Click the **X** button to remove assets.

### Step 3: Threats
Identify relevant threats. Pre-populated threats appear based on your framework.

For each threat:
- **Name** (required) - e.g., "Ransomware", "Insider Threat"
- **Category** - Cyber, Operational, Compliance, Strategic
- **Source** - Internal, External, or Environmental

### Step 4: Controls
Define the controls that mitigate your threats. Pre-populated controls appear based on your framework.

For each control:
- **Name** (required) - e.g., "Multi-Factor Authentication", "Encryption at Rest"
- **Type** - Preventive, Detective, or Corrective
- **Category** - Free text for grouping
- **Effectiveness** - Strong, Moderate, or Weak
- **Owner** - Team or individual responsible

### Step 5: Risk Assessment
Add risks using one of two modes:

#### Quick Add Mode (Default)
Rapidly add risks with essential fields:
1. **ID** auto-generates (R-001, R-002, etc.) - editable
2. Enter a **Risk Title**
3. Select a **Category** (Cyber, Operational, Compliance, Strategic, Third Party)
4. Click the **Inherent Likelihood** (1-5) and **Impact** (1-5) buttons
5. Click the **Residual Likelihood** (1-5) and **Impact** (1-5) buttons
6. Click **"+ Add"** to add the risk to the list

The score displays automatically as Likelihood x Impact with color coding.

#### Detail Mode
Full risk entry form with all fields including:
- Asset and Threat linkage
- Treatment strategy (Mitigate, Accept, Transfer, Avoid)
- Treatment plan description
- Risk owner and due date
- Status (Open, In Progress, Closed, Accepted)
- Control linkage

### Step 6: Review & Create
Review your complete register before saving:
- **Summary** - Name, framework, counts of assets/threats/controls/risks
- **Risk Distribution** - Breakdown by severity level (Critical, High, Medium, Low)
- **Heat Map Preview** - Interactive 5x5 matrix showing risk placement
  - Toggle between **Inherent Risk** and **Residual Risk** views
  - Adjust **Risk Appetite** threshold (Low, Moderate, High, Very High)
  - View above/within appetite counts

Click **"Create Risk Register"** to save. You will be redirected to the register detail page.

---

## Managing Risks

### Risk Table
The Risks tab shows all risks in a sortable, filterable table with columns:
- **ID** - Risk identifier (e.g., R-001)
- **Title** - Risk description
- **Category** - Risk category
- **Inherent** - Pre-control risk score with level badge
- **Residual** - Post-control risk score with level badge
- **Treatment** - Mitigation strategy
- **Status** - Current status
- **Owner** - Assigned owner

### Sorting
Click any column header to sort. Click again to reverse order. The active sort column shows an arrow indicator.

### Filtering by Status
Use the status filter buttons: **All**, **Open**, **In Progress**, **Closed**, **Accepted**

### Bulk Selection
Use checkboxes to select multiple risks for bulk operations.

### Adding a Risk
Click **"+ Add Risk"** to open the risk creation modal with all fields.

### Editing a Risk
Click any risk row to open the **Risk Detail Panel** (slide-over). Click the **edit icon** to modify fields.

---

## Heat Map

The Heatmap tab displays an interactive **5x5 risk matrix** plotting all risks by their Likelihood (Y-axis) and Impact (X-axis).

### Features
- **Toggle View** - Switch between Inherent Risk and Residual Risk views
- **Risk Appetite Line** - A dashed border showing the acceptable risk threshold
- **Risk Appetite Selector** - Adjust the threshold: Low (4+), Moderate (8+), High (12+), Very High (16+)
- **Color Coding**:
  - Green (1-3): Low risk
  - Yellow (4-7): Medium risk
  - Orange (8-15): High risk
  - Red (16-25): Critical risk
- **Risk Counts** - Each cell shows the number of risks at that score
- **Above/Within Appetite** - Summary counts below the heat map

---

## Analytics

The Analytics tab provides 4 visualization charts:

### Risks by Category
Bar chart showing the distribution of risks across categories (Cyber, Operational, Compliance, Strategic, Third Party).

### Treatment Strategy
Pie chart showing the breakdown of treatment approaches (Mitigate, Accept, Transfer, Avoid).

### Risk Status
Horizontal bar chart showing risks by current status (Open, In Progress, Closed, Accepted).

### Inherent vs Residual
Grouped bar chart comparing inherent and residual scores for each risk, demonstrating control effectiveness.

---

## Risk Detail Panel

Click any risk in the table to open a slide-over panel with three tabs:

### Details Tab
Full risk information including:
- Risk ID, title, description
- Category, treatment strategy, status
- Risk owner and due date
- Inherent and residual scores with visual badges
- Linked asset, threat, and controls
- Edit button to modify any field

### Comments Tab
Threaded discussion for each risk:
- Add comments with your name and timestamp
- View comment history in chronological order
- Comments are attributed to the logged-in user

### History Tab
Complete audit trail showing:
- Field-level change tracking (what changed, from what value, to what value)
- Who made the change
- Timestamp of each change
- Automatically recorded on every risk update

---

## Assets, Threats & Controls

These tabs (accessible from the register detail page) display data tables for each entity type.

### Viewing
Each tab shows a table with all items and their attributes. Click column headers to sort.

### Editing
Click the **edit pencil icon** on the register title bar to open the full Edit Register slide-over, which includes tabs for editing assets, threats, and controls with:
- **Add new** items with the "+ Add" button
- **Inline edit** existing items (click edit icon, modify fields, save)
- **Delete** items (click trash icon)

---

## Editing a Register

Click the **pencil icon** next to the register name in the navigation bar to open the Edit Register slide-over.

### Register Info Tab
Edit the register name, description, and framework.

### Assets Tab
Add, edit, or delete assets. Each asset has name, type, owner, and criticality fields.

### Threats Tab
Add, edit, or delete threats. Each threat has name, category, and source fields.

### Controls Tab
Add, edit, or delete controls. Each control has name, type, category, effectiveness, and owner fields.

---

## Clone Register

Cloning creates a complete deep copy of a register including all assets, threats, controls, and risks.

1. Click the **"Clone"** button on the register detail page
2. Enter a **new name** for the cloned register
3. Click **"Clone Register"**
4. You will be redirected to the new cloned register

This is useful for creating periodic assessments (e.g., quarterly reviews) based on a previous assessment.

---

## CSV Import

Bulk import risks from a CSV file.

1. Click **"Import CSV"** on the register detail page
2. Upload a CSV file with columns: `risk_id_label`, `title`, `risk_category`, `inherent_likelihood`, `inherent_impact`, `residual_likelihood`, `residual_impact`
3. Preview the parsed data in the modal
4. Click **"Import"** to add all risks

### CSV Format Requirements
- First row must be column headers
- Required columns: risk_id_label, title, risk_category, inherent_likelihood (1-5), inherent_impact (1-5), residual_likelihood (1-5), residual_impact (1-5)
- Optional columns: description, treatment, treatment_plan, risk_owner, due_date, status
- Maximum 500 rows per import

---

## PDF & Excel Export

### PDF Export
Click **"PDF"** to generate a professional PDF report containing:
- Register summary header with name, framework, and date
- Risk statistics summary
- Complete risk table with all scores and metadata
- Formatted for print and audit submission

### Excel Export
Click **"Excel"** to generate a formatted Excel workbook with:
- Summary sheet with register metadata
- Risks sheet with all risk data, color-coded cells
- Assets, Threats, and Controls on separate sheets

---

## Search

### Global Search
Available from the dashboard navigation bar:
1. Click the search input or press **/** (forward slash) to focus
2. Type at least 2 characters to search
3. Results show matching risks across all your registers
4. Click a result to navigate to that register

Search matches against risk IDs, titles, categories, and descriptions.

---

## Collaboration & Sharing

### Sharing a Register
1. Open a register you own
2. Click the **share icon** in the toolbar
3. Enter a collaborator's **email address**
4. Select their **role**: Editor or Viewer
5. Click **"Add"**

### Roles
- **Owner** - Full access including delete and sharing
- **Editor** - Can edit risks, assets, threats, controls, and register metadata
- **Viewer** - Read-only access to all register data

### Removing Collaborators
Click the **X** button next to a collaborator's name to revoke their access.

---

## Scoring Guide Reference

### Risk Score Formula
**Risk Score = Likelihood x Impact**

### Likelihood Scale

| Level | Value | Description |
|-------|-------|-------------|
| Rare | 1 | Very unlikely to occur |
| Unlikely | 2 | Could occur but not expected |
| Possible | 3 | May occur at some point |
| Likely | 4 | Will probably occur |
| Almost Certain | 5 | Expected to occur |

### Impact Scale

| Level | Value | Description |
|-------|-------|-------------|
| Minimal | 1 | Negligible impact on operations |
| Minor | 2 | Minor impact, easily recoverable |
| Moderate | 3 | Moderate impact requiring effort to recover |
| Major | 4 | Significant impact on operations |
| Critical | 5 | Severe impact, potential business failure |

### Risk Level Thresholds

| Level | Score Range | Color | Action |
|-------|-------------|-------|--------|
| Low | 1-3 | Green | Monitor and accept |
| Medium | 4-7 | Yellow | Review and consider treatment |
| High | 8-15 | Orange | Treat with priority |
| Critical | 16-25 | Red | Immediate action required |

### 5x5 Risk Matrix

|  | 1 - Minimal | 2 - Minor | 3 - Moderate | 4 - Major | 5 - Critical |
|---|---|---|---|---|---|
| **5 - Almost Certain** | 5 (Med) | 10 (High) | 15 (High) | 20 (Crit) | 25 (Crit) |
| **4 - Likely** | 4 (Med) | 8 (High) | 12 (High) | 16 (Crit) | 20 (Crit) |
| **3 - Possible** | 3 (Low) | 6 (Med) | 9 (High) | 12 (High) | 15 (High) |
| **2 - Unlikely** | 2 (Low) | 4 (Med) | 6 (Med) | 8 (High) | 10 (High) |
| **1 - Rare** | 1 (Low) | 2 (Low) | 3 (Low) | 4 (Med) | 5 (Med) |

### Treatment Options

| Strategy | Description |
|----------|-------------|
| **Mitigate** | Implement controls to reduce likelihood or impact |
| **Accept** | Acknowledge and monitor the risk without further action |
| **Transfer** | Shift the risk to a third party (insurance, outsourcing) |
| **Avoid** | Eliminate the activity that creates the risk |

---

*Built by Rose Achar & William Asare Yirenkyi*
