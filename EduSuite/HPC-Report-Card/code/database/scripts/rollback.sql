SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS client_hpc_cards;
DROP TABLE IF EXISTS client_hpc_entries;
DROP TABLE IF EXISTS client_hpc_competencies;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'HPC database rollback completed successfully.' AS Status;