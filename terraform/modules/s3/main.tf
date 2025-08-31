# S3 Bucket for Frontend Hosting
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.name_prefix}-frontend-${random_string.bucket_suffix.result}"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-frontend-bucket"
  })
}

# Random string for bucket suffix to ensure uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket CORS Configuration
resource "aws_s3_bucket_cors_configuration" "frontend" {
  count  = var.enable_cors ? 1 : 0
  bucket = aws_s3_bucket.frontend.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

# S3 Bucket Website Configuration
resource "aws_s3_bucket_website_configuration" "frontend" {
  count  = var.enable_website ? 1 : 0
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# S3 Bucket Policy for CloudFront
# S3 bucket policy for CloudFront - Commented out due to AWS account limitations
# resource "aws_s3_bucket_policy" "frontend" {
#   bucket = aws_s3_bucket.frontend.id
#
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Sid    = "AllowCloudFrontServicePrincipal"
#         Effect = "Allow"
#         Principal = {
#           Service = "cloudfront.amazonaws.com"
#         }
#         Action   = "s3:GetObject"
#         Resource = "${aws_s3_bucket.frontend.arn}/*"
#         Condition = {
#           StringEquals = {
#             "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
#           }
#         }
#       }
#     ]
#   })
#
#   depends_on = [aws_s3_bucket_public_access_block.frontend]
# }

# CloudFront Origin Access Control - Commented out due to AWS account limitations
# resource "aws_cloudfront_origin_access_control" "frontend" {
#   name                              = "${var.name_prefix}-frontend-oac"
#   description                       = "OAC for ${var.name_prefix} frontend"
#   origin_access_control_origin_type = "s3"
#   signing_behavior                  = "always"
#   signing_protocol                  = "sigv4"
# }

# CloudFront Distribution
# CloudFront Distribution - Commented out due to AWS account limitations
# resource "aws_cloudfront_distribution" "frontend" {
#   origin {
#     domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
#     origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
#     origin_id                = "S3-${aws_s3_bucket.frontend.bucket}"
#   }
#
#   enabled             = true
#   is_ipv6_enabled     = true
#   comment             = "${var.name_prefix} frontend distribution"
#   default_root_object = "index.html"
#
#   # Aliases (custom domain names)
#   aliases = var.domain_name != "" ? [var.domain_name, "www.${var.domain_name}"] : []

#
#   default_cache_behavior {
#     allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
#     cached_methods   = ["GET", "HEAD"]
#     target_origin_id = "S3-${aws_s3_bucket.frontend.bucket}"
#
#     forwarded_values {
#       query_string = false
#       cookies {
#         forward = "none"
#       }
#     }
#
#     viewer_protocol_policy = "redirect-to-https"
#     min_ttl                = 0
#     default_ttl            = 3600
#     max_ttl                = 86400
#     compress               = true
#   }
#
#   # Cache behavior for API calls (should not be cached)
#   ordered_cache_behavior {
#     path_pattern     = "/api/*"
#     allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
#     cached_methods   = ["GET", "HEAD"]
#     target_origin_id = "S3-${aws_s3_bucket.frontend.bucket}"
#
#     forwarded_values {
#       query_string = true
#       headers      = ["*"]
#       cookies {
#         forward = "all"
#       }
#     }
#
#     viewer_protocol_policy = "redirect-to-https"
#     min_ttl                = 0
#     default_ttl            = 0
#     max_ttl                = 0
#     compress               = true
#   }
#
#   # Cache behavior for static assets (longer cache)
#   ordered_cache_behavior {
#     path_pattern     = "/static/*"
#     allowed_methods  = ["GET", "HEAD"]
#     cached_methods   = ["GET", "HEAD"]
#     target_origin_id = "S3-${aws_s3_bucket.frontend.bucket}"
#
#     forwarded_values {
#       query_string = false
#       cookies {
#         forward = "none"
#       }
#     }
#
#     viewer_protocol_policy = "redirect-to-https"
#     min_ttl                = 86400
#     default_ttl            = 31536000
#     max_ttl                = 31536000
#     compress               = true
#   }
#
#
#   price_class = var.cloudfront_price_class
#
#   restrictions {
#     geo_restriction {
#       restriction_type = "none"
#     }
#   }
#
#   viewer_certificate {
#     # Use ACM certificate if domain is provided, otherwise use default CloudFront certificate
#     acm_certificate_arn            = var.domain_name != "" && var.certificate_arn != "" ? var.certificate_arn : null
#     ssl_support_method             = var.domain_name != "" && var.certificate_arn != "" ? "sni-only" : null
#     minimum_protocol_version       = var.domain_name != "" && var.certificate_arn != "" ? "TLSv1.2_2021" : null
#     cloudfront_default_certificate = var.domain_name == "" || var.certificate_arn == ""
#   }
#
#   # Custom error responses for SPA
#   custom_error_response {
#     error_code         = 404
#     response_code      = 200
#     response_page_path = "/index.html"
#   }
#
#   custom_error_response {
#     error_code         = 403
#     response_code      = 200
#     response_page_path = "/index.html"
#   }
#
#   tags = merge(var.tags, {
#     Name = "${var.name_prefix}-frontend-distribution"
#   })
# }

# Route53 Records - Commented out due to AWS account limitations (CloudFront dependency)
# data "aws_route53_zone" "main" {
#   count = var.domain_name != "" ? 1 : 0
#   name  = var.domain_name
# }
#
# resource "aws_route53_record" "frontend" {
#   count   = var.domain_name != "" ? 1 : 0
#   zone_id = data.aws_route53_zone.main[0].zone_id
#   name    = var.domain_name
#   type    = "A"
#
#   alias {
#     name                   = aws_cloudfront_distribution.frontend.domain_name
#     zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
#     evaluate_target_health = false
#   }
# }
#
# resource "aws_route53_record" "frontend_www" {
#   count   = var.domain_name != "" ? 1 : 0
#   zone_id = data.aws_route53_zone.main[0].zone_id
#   name    = "www.${var.domain_name}"
#   type    = "A"
#
#   alias {
#     name                   = aws_cloudfront_distribution.frontend.domain_name
#     zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
#     evaluate_target_health = false
#   }
# }

# S3 Bucket for Build Artifacts
resource "aws_s3_bucket" "build_artifacts" {
  bucket = "${var.name_prefix}-build-artifacts-${random_string.artifacts_suffix.result}"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-build-artifacts-bucket"
  })
}

resource "random_string" "artifacts_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Versioning for Build Artifacts
resource "aws_s3_bucket_versioning" "build_artifacts" {
  bucket = aws_s3_bucket.build_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption for Build Artifacts
resource "aws_s3_bucket_server_side_encryption_configuration" "build_artifacts" {
  bucket = aws_s3_bucket.build_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block for Build Artifacts
resource "aws_s3_bucket_public_access_block" "build_artifacts" {
  bucket = aws_s3_bucket.build_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Configuration for Build Artifacts
resource "aws_s3_bucket_lifecycle_configuration" "build_artifacts" {
  bucket = aws_s3_bucket.build_artifacts.id

  rule {
    id     = "delete_old_artifacts"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = var.build_artifacts_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}
