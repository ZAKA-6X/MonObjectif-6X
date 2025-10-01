const supabase = require("../configuration/supabase");
const supabaseAdmin = require("../configuration/supabaseAdmin");

// Get all active presentations
exports.getActivePresentations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("presentations")
      .select("*")
      .eq("active", true);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Get active presentations error:", error);
    res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// Get user's group presentations
exports.getMyGroupPresentations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's group
    const { data: membership, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId)
      .single();

    if (memberError || !membership) {
      return res.status(404).json({ message: "Groupe non trouvé" });
    }

    // Get presentations for that group
    const { data: presentations, error: presError } = await supabase
      .from("presentations")
      .select("*")
      .eq("group_id", membership.group_id);

    if (presError) throw presError;
    res.json(presentations);
  } catch (error) {
    console.error("Get group presentations error:", error);
    res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// Get presentation details by ID
exports.getPresentationDetails = async (req, res) => {
  try {
    const { presentationId } = req.params;
    const { userId } = req.query;

    // Get presentation details
    const { data: presentation, error: presError } = await supabase
      .from("presentations")
      .select("*")
      .eq("id", presentationId)
      .single();

    if (presError || !presentation) {
      return res.status(404).json({ message: "Présentation non trouvée" });
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from("group")
      .select("*")
      .eq("id", presentation.group_id)
      .single();

    if (groupError) {
      console.error("Group fetch error:", groupError);
    }

    // Determine user type and permissions
    let userType = "student_not_in_group";
    let permissions = {
      canEditDescription: false,
      canUpload: false,
      canRate: false,
      canAddFeedback: false,
      canViewAll: true,
    };
    let hasRated = false;

    if (userId) {
      // Get user role
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (!userError && user) {
        if (user.role === "TEACHER") {
          userType = "teacher";
          permissions = {
            canEditDescription: false,
            canUpload: false,
            canRate: true,
            canAddFeedback: true,
            canViewAll: true,
          };
        } else {
          // Student - check group membership
          const { data: userMembership, error: userMemberError } =
            await supabase
              .from("group_members")
              .select("group_id")
              .eq("user_id", userId)
              .single();

          if (!userMemberError && userMembership) {
            if (presentation.group_id === userMembership.group_id) {
              userType = "student_in_group";
              permissions = {
                canEditDescription: true,
                canUpload: true,
                canRate: false,
                canAddFeedback: false,
                canViewAll: true,
              };
            } else {
              userType = "student_not_in_group";
              permissions = {
                canEditDescription: false,
                canUpload: false,
                canRate: true,
                canAddFeedback: false,
                canViewAll: true,
              };

              // Check if user has rated this presentation
              const { data: existingRating, error: ratingError } =
                await supabase
                  .from("ratings")
                  .select("*")
                  .eq("presentation_id", presentationId)
                  .eq("user_id", userId)
                  .single();

              if (!ratingError && existingRating) {
                hasRated = true;
              }
            }
          }
        }
      }
    }

    // Return presentation data with user type and permissions
    res.json({
      presentation,
      group: group || { name: "Groupe inconnu" },
      userType,
      permissions,
      hasRated,
    });
  } catch (error) {
    console.error("Presentation details error:", error);
    res.status(500).json({ message: "Erreur", error: error.message });
  }
};

// Rate or update a presentation rating
exports.ratePresentation = async (req, res) => {
  try {
    const { presentationId } = req.params;
    const { userId, rating } = req.body;

    // Validate input
    if (!userId || rating === undefined || rating === null) {
      return res.status(400).json({
        error: "userId et rating sont requis",
      });
    }

    // Validate rating range
    if (rating < 0 || rating > 20) {
      return res.status(400).json({
        error: "La note doit être entre 0 et 20",
      });
    }

    // Get presentation details
    const { data: presentation, error: presError } = await supabase
      .from("presentations")
      .select("*, group_id")
      .eq("id", presentationId)
      .single();

    if (presError || !presentation) {
      return res.status(404).json({
        error: "Présentation non trouvée",
      });
    }

    // Get user role to determine if group membership check is needed
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
      });
    }

    let userMembership = null;

    // For students, check group membership (teachers can rate any presentation)
    if (user.role !== "TEACHER") {
      const { data: membership, error: memberError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId)
        .single();

      if (memberError || !membership) {
        return res.status(404).json({
          error: "Utilisateur non trouvé dans un groupe",
        });
      }

      userMembership = membership;

      // Check if student is trying to rate their own group's presentation
      if (presentation.group_id === userMembership.group_id) {
        return res.status(403).json({
          error:
            "Vous ne pouvez pas noter la présentation de votre propre groupe",
        });
      }
    }

    // Check if user has already rated this presentation
    const { data: existingRating, error: checkError } = await supabase
      .from("ratings")
      .select("*")
      .eq("presentation_id", presentationId)
      .eq("user_id", userId)
      .single();

    let isUpdate = false;

    if (existingRating) {
      // Update existing rating
      isUpdate = true;
      const { error: updateRatingError } = await supabase
        .from("ratings")
        .update({ rating: rating })
        .eq("presentation_id", presentationId)
        .eq("user_id", userId);

      if (updateRatingError) {
        throw updateRatingError;
      }
    } else {
      // Insert new rating
      const { error: insertError } = await supabase.from("ratings").insert({
        presentation_id: presentationId,
        user_id: userId,
        rating: rating,
      });

      if (insertError) {
        throw insertError;
      }
    }

    // Calculate new average from all ratings
    const { data: allRatings, error: ratingsError } = await supabase
      .from("ratings")
      .select("rating")
      .eq("presentation_id", presentationId);

    if (ratingsError) {
      throw ratingsError;
    }

    // Calculate average
    let newPoint = 0;
    if (allRatings && allRatings.length > 0) {
      const sum = allRatings.reduce((acc, r) => acc + parseFloat(r.rating), 0);
      newPoint = sum / allRatings.length;
      // Round to 2 decimal places
      newPoint = Math.round(newPoint * 100) / 100;
    }

    // Update presentation with new point
    const { error: updateError } = await supabase
      .from("presentations")
      .update({ point: newPoint })
      .eq("id", presentationId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: isUpdate
        ? "Note mise à jour avec succès"
        : "Note ajoutée avec succès",
      newPoint: newPoint,
      totalRatings: allRatings.length,
      isUpdate: isUpdate,
    });
  } catch (error) {
    console.error("Rate presentation error:", error);
    res.status(500).json({
      error: "Erreur lors de la notation",
      details: error.message,
    });
  }
};

// Update presentation description
exports.updatePresentationDescription = async (req, res) => {
  try {
    const { presentationId } = req.params;
    const { userId, description } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).json({
        error: "userId est requis",
      });
    }

    if (description === undefined || description === null) {
      return res.status(400).json({
        error: "description est requise",
      });
    }

    // Get presentation details
    const { data: presentation, error: presError } = await supabase
      .from("presentations")
      .select("*, group_id")
      .eq("id", presentationId)
      .single();

    if (presError || !presentation) {
      return res.status(404).json({
        error: "Présentation non trouvée",
      });
    }

    // Get user's group
    const { data: userMembership, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId)
      .single();

    if (memberError || !userMembership) {
      return res.status(404).json({
        error: "Utilisateur non trouvé dans un groupe",
      });
    }

    // Check if user belongs to the presentation's group
    if (presentation.group_id !== userMembership.group_id) {
      return res.status(403).json({
        error: "Vous ne pouvez modifier que les présentations de votre groupe",
      });
    }

    // Update presentation description
    const { error: updateError } = await supabase
      .from("presentations")
      .update({ description: description })
      .eq("id", presentationId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: "Description mise à jour avec succès",
      description: description,
    });
  } catch (error) {
    console.error("Update description error:", error);
    res.status(500).json({
      error: "Erreur lors de la mise à jour de la description",
      details: error.message,
    });
  }
};

// Update presentation feedback (teacher only)
exports.updatePresentationFeedback = async (req, res) => {
  try {
    const { presentationId } = req.params;
    const { userId, feedback } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).json({
        error: "userId est requis",
      });
    }

    if (feedback === undefined || feedback === null) {
      return res.status(400).json({
        error: "feedback est requis",
      });
    }

    // Get user details to check role
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
      });
    }

    // Check if user is teacher
    if (user.role !== "TEACHER") {
      return res.status(403).json({
        error: "Seuls les enseignants peuvent ajouter des feedbacks",
      });
    }

    // Get presentation details
    const { data: presentation, error: presError } = await supabase
      .from("presentations")
      .select("*")
      .eq("id", presentationId)
      .single();

    if (presError || !presentation) {
      return res.status(404).json({
        error: "Présentation non trouvée",
      });
    }

    // Update presentation feedback
    const { error: updateError } = await supabase
      .from("presentations")
      .update({ feedback: feedback })
      .eq("id", presentationId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      message: "Feedback ajouté avec succès",
      feedback: feedback,
    });
  } catch (error) {
    console.error("Update feedback error:", error);
    res.status(500).json({
      error: "Erreur lors de l'ajout du feedback",
      details: error.message,
    });
  }
};

// Download presentation file
exports.downloadPresentation = async (req, res) => {
  try {
    const { presentationId } = req.params;
    const { userId } = req.query;

    // Get presentation details
    const { data: presentation, error: presError } = await supabase
      .from("presentations")
      .select("*")
      .eq("id", presentationId)
      .single();

    if (presError || !presentation) {
      return res.status(404).json({ message: "Présentation non trouvée" });
    }

    // Check if file exists (path_file is not NULL)
    if (!presentation.path_file || presentation.path_file.trim() === '') {
      return res.status(404).json({ message: "No file uploaded" });
    }

    // Check user permissions (similar to getPresentationDetails)
    let hasAccess = false;

    if (userId) {
      // Get user role
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (!userError && user) {
        if (user.role === "TEACHER") {
          // Teachers can download any presentation
          hasAccess = true;
        } else {
          // Students - check group membership
          const { data: userMembership, error: userMemberError } =
            await supabase
              .from("group_members")
              .select("group_id")
              .eq("user_id", userId)
              .single();

          if (!userMemberError && userMembership) {
            // Students can download presentations from their own group or other groups
            hasAccess = true;
          }
        }
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ message: "Accès non autorisé au téléchargement" });
    }

    // Download file from Supabase Storage
    const { data, error: downloadError } = await supabaseAdmin
      .storage
      .from('presentation-ppts')
      .download(presentation.path_file);

    if (downloadError) {
      console.error("Download error:", downloadError);
      return res.status(500).json({ message: "Erreur lors du téléchargement du fichier" });
    }

    // Set headers for file download
    const fileNameHeader = presentation.name_file || `presentation_${presentationId}.pptx`;
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileNameHeader}"`);

    // Send file buffer
    res.send(Buffer.from(await data.arrayBuffer()));

  } catch (error) {
    console.error("Download presentation error:", error);
    res.status(500).json({
      message: "Erreur lors du téléchargement",
      error: error.message
    });
  }
};
