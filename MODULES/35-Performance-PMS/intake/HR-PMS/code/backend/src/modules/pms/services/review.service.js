const repository = require("../repositories/review.repository");
const ApiError = require("../../../utils/ApiError");

const getAllReviews = async (orgId) => {
    return await repository.getAllReviews(orgId);
};

const getReviewById = async (id, orgId) => {

    const review = await repository.getReviewById(id, orgId);

    if (!review) {
        throw new ApiError(404, "Review not found.");
    }

    return review;
};

const getEmployeeReviews = async (
    employeeId,
    cycleId,
    orgId
) => {

    return await repository.getEmployeeReviews(
        employeeId,
        cycleId,
        orgId
    );

};

const createReview = async (reviewData) => {

    const id = await repository.createReview(
        reviewData
    );

    return await repository.getReviewById(
        id,
        reviewData.org_id
    );

};

const updateReview = async (
    id,
    orgId,
    reviewData
) => {

    const review = await repository.getReviewById(
        id,
        orgId
    );

    if (!review) {
        throw new ApiError(404, "Review not found.");
    }

    await repository.updateReview(
        id,
        orgId,
        reviewData
    );

    return await repository.getReviewById(
        id,
        orgId
    );

};

const deleteReview = async (id, orgId) => {

    const review = await repository.getReviewById(
        id,
        orgId
    );

    if (!review) {
        throw new ApiError(404, "Review not found.");
    }

    await repository.deleteReview(id, orgId);

    return {
        message: "Review deleted successfully."
    };

};

module.exports = {
    getAllReviews,
    getReviewById,
    getEmployeeReviews,
    createReview,
    updateReview,
    deleteReview
};