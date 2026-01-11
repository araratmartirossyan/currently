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
    // Help server interpret relative times (e.g. "tomorrow 3pm")
    formData.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);

    const response = await $fetch("/api/task/process", {
      method: "POST",
      body: formData,
    });

    return response;
  },

  async processVoiceMeeting(file: File) {
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);

    return await $fetch("/api/calendar/process-voice", {
      method: "POST",
      body: formData,
    });
  },
};
