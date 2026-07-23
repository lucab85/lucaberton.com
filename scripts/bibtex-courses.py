courses = [
    # Coursera
    {
        "title": "Root Cause Analysis: Principles and Benefits",
        "description": "Principles and Benefits.",
        "platform": "Coursera",
        "url": "https://imp.i384100.net/5grP5L"
    },
    {
        "title": "Microsoft SQL Server",
        "description": "Performance Tuning Essentials",
        "platform": "Coursera",
        "url": "https://imp.i384100.net/4GJqL1"
    },
    {
        "title": "API Validation with Postman",
        "description": "Master API validation and testing using Postman.",
        "platform": "Coursera",
        "url": "https://imp.i384100.net/55AxLD"
    },
    {
        "title": "Introduction to Chip Design with Open-Source EDA Tools",
        "description": "Design and simulate digital circuits using open-source tools.",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/introduction-to-chip-design-with-open-source-eda-tools"
    },
    {
        "title": "Back-End Infrastructure",
        "description": "Servers, Secure APIs and Data.",
        "platform": "Coursera",
        "url": "https://imp.i384100.net/da195k"
    },
    {
        "title": "Technical Troubleshooting",
        "description": "Diagnostics, Networks, Customers.",
        "platform": "Coursera",
        "url": "https://imp.i384100.net/9g5MjQ"
    },
    {
        "title": "Operationalizing ML Models: MLOps for Scalable AI",
        "description": "Turn ML prototypes into robust, scalable, and maintainable systems using real-world tools and practices.",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/operationalizing-ml-models-mlops-for-scalable-ai"
    },
    {
        "title": "ServiceNow Basics: IT Automation & AI-Powered Workflows",
        "description": "Streamline IT operations and boost service quality by designing AI-powered workflows in ServiceNow.",
        "platform": "Coursera",
        "url": "https://www.coursera.org/learn/servicenow-basics-it-automation--ai-powered-workflows/"
    },

    # Pluralsight
    {
        "title": "Automating Azure DevTest Labs",
        "description": "Automating lab management tasks, integrating Azure DevTest labs with CI/CD pipelines and best practices.",
        "platform": "Pluralsight",
        "url": "https://pluralsight.pxf.io/5g2o4o"
    },
    {
        "title": "Optimizing Azure DevTest Labs",
        "description": "Enhance performance, security, and cost efficiency of Azure DevTest Labs.",
        "platform": "Pluralsight",
        "url": "https://pluralsight.pxf.io/099PML"
    },
    {
        "title": "Federated Learning and Privacy-preserving RAGs",
        "description": "Implement secure AI models using federated learning.",
        "platform": "Pluralsight",
        "url": "https://pluralsight.pxf.io/5g2o4o"
    },
    {
        "title": "Evaluating RAG Solutions",
        "description": "Choosing the right RAG model, configuring and optimizing Retrieval-Augmented Generation setups.",
        "platform": "Pluralsight",
        "url": "https://pluralsight.pxf.io/BXmbg9"
    },

    # Educative
    {
        "title": "Automating IT Infrastructure with Ansible",
        "description": "Learn Ansible to automate IT operations and enhance system reliability.",
        "platform": "Educative",
        "url": "https://www.educative.io/courses/automating-it-infrastructure-with-ansible/"
    },

    # Udemy
    {
        "title": "Learn Ansible Automation in 250+ Examples",
        "description": "Comprehensive Ansible training with real-world use cases.",
        "platform": "Udemy",
        "url": "https://trk.udemy.com/EENomD"
    },
    {
        "title": "Terraform for Beginners",
        "description": "Master Terraform to build scalable infrastructure using IaC principles.",
        "platform": "Udemy",
        "url": "https://trk.udemy.com/nXQ0ro"
    },

    # Skillshare
    {
        "title": "IT Automation with Ansible Quickstart",
        "description": "Automate IT tasks, deploy apps, secure systems, and streamline workflows in 40 minutes.",
        "platform": "Skillshare",
        "url": "https://skl.sh/4gzJrFB"
    },

    # Starweaver
    {
        "title": "Securing Cloud Operations",
        "description": "Secure AWS, Azure, and GCP workloads with hands-on IAM, network controls, cloud-native tools, and audit-ready checklists.",
        "platform": "Starweaver",
        "url": "https://do.starweaver.com/courses/securing-cloud-operations"
    }
]

# Generate BibTeX entries
def generate_bibtex_entry(course, index):
    return f"""@misc{{course{index},
  author    = {{Luca Berton}},
  title     = {{{course["title"]}}},
  howpublished = {{\\url{{{course["url"]}}}}},
  note      = {{{course["platform"]} – {course["description"]}}}
}}"""

# Write to file
with open("bibtex-courses.bib", "w") as f:
    f.write("\n\n".join(generate_bibtex_entry(c, i+1) for i, c in enumerate(courses)))

print("BibTeX file 'bibtex-courses.bib' created successfully.")
