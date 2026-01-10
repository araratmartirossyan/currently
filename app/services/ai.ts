export const aiService = {
  /**
   * Process a voice note server-side with optional project list context.
   * @param file audio file (webm)
   * @param projects array of project names to help the model map correctly
   */
  async processVoiceNote(file: File, projects: string[] = []) {
    const formData = new FormData();
    formData.append("audio", file);
    if (projects.length) {
      formData.append("projects", JSON.stringify(projects));
    }

    const response = await $fetch("/api/task/process", {
      method: "POST",
      body: formData,
    });

    return response;
  },
};
